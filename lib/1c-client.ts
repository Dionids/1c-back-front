import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ parseTagValue: false, parseAttributeValue: false });

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Не задана переменная окружения: ${name}`);
    return value;
}

async function callSoap(operation: string, jsonBody?: string): Promise<unknown> {
    const ONEC_URL = requireEnv('ONEC_URL');
    const ONEC_LOGIN = requireEnv('ONEC_LOGIN');
    const ONEC_PASSWORD = requireEnv('ONEC_PASSWORD');

    const operationBody = jsonBody
        ? `<tns:${operation}><tns:JSON>${jsonBody}</tns:JSON></tns:${operation}>`
        : `<tns:${operation}/>`;

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://export-reports/">
    <soap:Body>
        ${operationBody}
    </soap:Body>
</soap:Envelope>`;

    const response = await axios.post(ONEC_URL, soapEnvelope, {
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        auth: { username: ONEC_LOGIN, password: ONEC_PASSWORD },
    });

    const parsed = parser.parse(response.data);
    const body = parsed['soap:Envelope']['soap:Body'];
    const operationResponse = body[`m:${operation}Response`];
    const returnValue = operationResponse['m:return'];

    return JSON.parse(returnValue);
}

export async function getRentalObjects(): Promise<string[]> {
    return callSoap('GetRentalObjects') as Promise<string[]>;
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
    return callSoap('OSVAccounts', JSON.stringify(params));
}

export async function getCalculation(params: {
    selected_rent_object: string | null;
}) {
    return callSoap('Calculation', JSON.stringify(params));
}
