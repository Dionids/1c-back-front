import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const ONEC_URL = process.env.ONEC_URL!;
const ONEC_LOGIN = process.env.ONEC_LOGIN!;
const ONEC_PASSWORD = process.env.ONEC_PASSWORD!;

const parser = new XMLParser();

async function callSoap(operation: string, jsonBody: string): Promise<unknown> {
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://export-reports/">
    <soap:Body>
        <tns:${operation}>
            <tns:JSON>${jsonBody}</tns:JSON>
        </tns:${operation}>
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
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://export-reports/">
    <soap:Body>
        <tns:GetRentalObjects/>
    </soap:Body>
</soap:Envelope>`;

    const response = await axios.post(ONEC_URL, soapEnvelope, {
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        auth: { username: ONEC_LOGIN, password: ONEC_PASSWORD },
    });

    const parsed = parser.parse(response.data);
    const body = parsed['soap:Envelope']['soap:Body'];
    const returnValue = body['m:GetRentalObjectsResponse']['m:return'];

    return JSON.parse(returnValue);
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