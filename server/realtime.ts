import { Response } from 'express';

type RealtimeEvent = {
  type: string;
  userId?: string;
  adminOnly?: boolean;
  public?: boolean;
};

type Client = { response: Response; userId: string; isAdmin: boolean };
const clients = new Set<Client>();

export function subscribe(response: Response, userId: string, isAdmin: boolean) {
  const client = { response, userId, isAdmin };
  clients.add(client);
  response.write('event: connected\ndata: {}\n\n');
  return () => clients.delete(client);
}

export function publish(event: RealtimeEvent) {
  const payload = `event: data-change\ndata: ${JSON.stringify({ type: event.type })}\n\n`;
  for (const client of clients) {
    if (event.adminOnly && !client.isAdmin) continue;
    if (!event.public && !event.adminOnly && event.userId && client.userId !== event.userId) continue;
    client.response.write(payload);
  }
}

// Keep intermediary proxies from silently closing otherwise idle SSE streams.
setInterval(() => {
  for (const client of clients) client.response.write(': keepalive\n\n');
}, 25_000).unref();
