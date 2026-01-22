import { CheFuClient } from "./client";

export class Auth {
  client: CheFuClient;

  constructor(client: CheFuClient) {
    this.client = client;
  }

  login(email: string, password: string) {
    return this.client.post("/auth/login", { email, password });
  }

  register(email: string, password: string) {
    return this.client.post("/auth/register", { email, password });
  }
}
