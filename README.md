# CheFu Academy SDK

A fully typed **TypeScript SDK** for interacting with the **CheFu Academy** platform.  
This SDK simplifies authentication, API requests, and access to CheFu Academy resources such as courses.

Designed for **Node.js** and modern JavaScript/TypeScript projects.

---

## ✨ Features

- 🔐 API key–based authentication
- 📦 Centralized API client
- 📚 Course listing & retrieval
- 🧠 Clean, minimal SDK design
- 🧾 Full TypeScript typings
- 🚀 Ready for production & npm

---

## 📦 Installation

```bash
npm install chefu-academy-sdk
```

or using yarn:

```bash
yarn add chefu-academy-sdk
```

---

## 🚀 Quick Start

### Import the SDK

```ts
import { CheFuAcademy } from "chefu-academy-sdk";
```

### Initialize the client

```ts
const sdk = new CheFuAcademy({
  apiKey: "YOUR_API_KEY",
});
```

### Fetch courses

```ts
async function main() {
  const courses = await sdk.courses.getAll();
  console.log(courses);
}

main();
```

---

## 📚 Available APIs

### Courses

```ts
sdk.courses.getAll();        // List all courses
sdk.courses.getById(courseId); // Get a single course
```

### Authentication

Authentication is handled automatically using your API key.

```ts
new CheFuAcademy({
  apiKey: process.env.CHEFU_API_KEY,
});
```

---

## 🛠 Development

### Scripts

```bash
npm run build   # Build SDK
npm run lint    # Lint code
npm test        # Run tests
```

### Project Structure

```
src/
 ├─ auth.ts        # Authentication logic
 ├─ client.ts      # HTTP client
 ├─ courses.ts     # Course endpoints
 ├─ index.ts       # Public SDK exports
```

---

## 📄 Example Project

```ts
import { CheFuAcademy } from "chefu-academy-sdk";

const sdk = new CheFuAcademy({ apiKey: "sk_live_xxx" });

const courses = await sdk.courses.getAll();
console.log(courses);
```

---

## 🧪 Requirements

- Node.js 18+
- TypeScript 5+ (optional but recommended)

---

## 📜 License

MIT License © CheFu Academy
