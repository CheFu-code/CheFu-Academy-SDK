import { CheFuClient } from "./client";

export class Courses {
  client: CheFuClient;

  constructor(client: CheFuClient) {
    this.client = client;
  }

  getAll() {
    return this.client.request("/courses");
  }

  getById(courseId: string) {
    return this.client.request("/courses/view", { courseId });
  }
}
