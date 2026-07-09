import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
    parseTagValue: false,
    parseAttributeValue: false,
    ignoreAttributes: true,
    removeNSPrefix: true,
    trimValues: true,
});

function requireEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined) throw new Error(`Не задана переменная окружения: ${name}`);
    return value;
}

function escapeXml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function callSoap(operation: string, jsonBody?: string): Promise<unknown> {
    const ONEC_URL = requireEnv('ONEC_URL');
    const ONEC_LOGIN = requireEnv('ONEC_LOGIN');
    const ONEC_PASSWORD = requireEnv('ONEC_PASSWORD');

    const operationBody = jsonBody
        ? `<tns:${operation}><tns:JSON>${escapeXml(jsonBody)}</tns:JSON></tns:${operation}>`
        : `<tns:${operation}/>`;

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://export-reports/">
    <soap:Body>
        ${operationBody}
    </soap:Body>
</soap:Envelope>`;

    const response = await axios.post(ONEC_URL, soapEnvelope, {
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            SOAPAction: `http://export-reports/#ExportReports:${operation}`,
        },
        auth: { username: ONEC_LOGIN, password: ONEC_PASSWORD },
        responseType: 'text',
    });

    const parsed = parser.parse(response.data);
    const body = parsed?.Envelope?.Body;
    if (!body) throw new Error('Некорректный SOAP-ответ: не найден Body');

    const fault = body.Fault;
    if (fault) {
        const reason = fault?.faultstring ?? fault?.Reason?.Text ?? JSON.stringify(fault);
        throw new Error(`SOAP Fault: ${reason}`);
    }

    const opResponse = body[`${operation}Response`];
    if (!opResponse) throw new Error(`SOAP-ответ не содержит ${operation}Response`);

    const returnValue = opResponse.return;
    if (returnValue === undefined || returnValue === null) {
        throw new Error(`SOAP-ответ ${operation} не содержит return`);
    }

    return JSON.parse(String(returnValue));
}

export async function getRentalObjects(): Promise<string[]> {
    const raw = (await callSoap('GetRentalObjects')) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.map((v) => String(v)).filter((v) => v.trim() !== '' && v.trim() !== '-');
}

export async function getOSVRentalObjects(params: {
    date_from: string;
    date_to: string;
    selected_rent_object: string | null;
}) {
    return callSoap('OSVRentalObjects', JSON.stringify(params));
}

export async function getOSVAccounts(params: {
    date_from: string;
    date_to: string;
    selected_rent_objects: string[] | null;
}) {
    return callSoap('OSVRentalAccounts', JSON.stringify(params));
}

export async function getCalculation(params: {
    selected_rent_object: string | null;
}) {
    return callSoap('Calculation', JSON.stringify(params));
}