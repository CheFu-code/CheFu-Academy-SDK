// CheFu-Academy-sdk/src/index.ts

import { Auth } from "./auth";
import { CheFuClient, CheFuConfig } from "./client";
import { Courses } from "./courses";

export default class CheFuAcademy {
  auth: Auth;
  courses: Courses;

  constructor(config: CheFuConfig) {
    const client = new CheFuClient(config);

    this.auth = new Auth(client);
    this.courses = new Courses(client);
  }
}
