
import express from "express";
import fs from "fs";
import path from "path";
import studentRoutes from "./routes/studentRoutes";

const app = express();
const PORT = 3000;

app.use(express.json());

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "students.json");

if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]", "utf-8");
}

app.get("/", (_req, res) => {
    res.json({
        message: "Student Management System API is running"
    });
});

// Student routes
app.use("/api/students", studentRoutes);

// Handle invalid JSON
app.use((
    error: any,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    if (error instanceof SyntaxError && "body" in error) {
        res.status(400).json({ message: "Invalid JSON request body." });
        return;
    }

    next(error);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});