import {config} from "dotenv";
config();  // Cargar variables de entorno desde .env
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Launch, LaunchFilters, Summary, YearStat } from "../lib/types";

const raw = new DynamoDBClient({
    region: process.env.AWS_DEFAULT_REGION ?? "us-east-1",
});

export const docClient = DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true },
    unmarshallOptions: { wrapNumbers: false },
});

export const TABLE_NAME = process.env.TABLE_NAME ?? "spaces_launches";


async function scanAll(): Promise<Launch[]> {
    const items: Launch[] = [];
    let lastKey: Record<string, unknown> | undefined;

    do {
        const resp = await docClient.send(
            new ScanCommand({
                TableName: TABLE_NAME,
                ExclusiveStartKey: lastKey,
            })
        );
        items.push(...((resp.Items ?? []) as Launch[]));
        lastKey = resp.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastKey);

    return items;
}


export async function getLaunches(filters: LaunchFilters): Promise<Launch[]> {
    let items = await scanAll();

    if (filters.status) {
        items = items.filter(i => i.status === filters.status);
    }

    if (filters.year) {
        items = items.filter(i => i.date_utc?.startsWith(String(filters.year)));
    }

    if (filters.search) {
        const q = filters.search.toLowerCase();
        items = items.filter(i => i.mission_name?.toLowerCase().includes(q));
    }

    items.sort((a, b) => (b.date_utc ?? "").localeCompare(a.date_utc ?? ""));

    const limit = filters.limit ?? 200;
    const offset = filters.offset ?? 0;
    return items.slice(offset, offset + limit);
}

export async function getLaunchById(id: string): Promise<Launch | null> {
    const resp = await docClient.send(
        new GetCommand({ TableName: TABLE_NAME, Key: { launch_id: id } })
    );
    return (resp.Item as Launch) ?? null;
}

export async function getSummary(): Promise<Summary> {
    const items = await scanAll();
    const counts = { success: 0, failed: 0, upcoming: 0, unknown: 0 };

    for (const item of items) {
        const s = (item.status ?? "unknown") as keyof typeof counts;
        counts[s] = (counts[s] ?? 0) + 1;
    }

    return { total: items.length, ...counts };
}

export async function getByYear(): Promise<YearStat[]> {
    const items = await scanAll();
    const map = new Map<number, YearStat>();

    for (const item of items) {
        const year = Number(item.date_utc?.slice(0, 4));
        if (!year || isNaN(year)) continue;

        if (!map.has(year)) {
            map.set(year, { year, total: 0, success: 0, failed: 0, upcoming: 0 });
        }

        const stat = map.get(year)!;
        stat.total++;
        const s = item.status;
        if (s === "success" || s === "failed" || s === "upcoming") stat[s]++;
    }

    return [...map.values()].sort((a, b) => a.year - b.year);
}




