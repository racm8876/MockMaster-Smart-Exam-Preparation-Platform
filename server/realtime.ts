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

// A suspended user must not keep an already-open event stream. Closing it
// causes the client to re-check its session and return to the signed-out view.
export function disconnectUser(userId: string) {
  for (const client of clients) {
    if (client.userId !== userId) continue;
    client.response.write('event: access-revoked\ndata: {}\n\n');
    client.response.end();
    clients.delete(client);
  }
}

// Keep intermediary proxies from silently closing otherwise idle SSE streams.
setInterval(() => {
  for (const client of clients) client.response.write(': keepalive\n\n');
}, 25_000).unref();
