
import { Router, Request, Response } from "express";

import {
    listStudents,
    findStudent,
    insertStudent,
    updateStudent,
    deleteStudent,
    bulkInsertStudents,
    bulkUpdateStudents,
    bulkDeleteStudents
} from "../controllers/studentController";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
    const result = listStudents();
    res.status(result.status).json(result.body);
});

router.get("/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ message: "Invalid student ID." });
        return;
    }

    const result = findStudent(id);
    res.status(result.status).json(result.body);
});

router.post("/", (req: Request, res: Response) => {
    const result = insertStudent(req.body);
    res.status(result.status).json(result.body);
});

router.put("/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ message: "Invalid student ID." });
        return;
    }

    const result = updateStudent(id, req.body);
    res.status(result.status).json(result.body);
});

router.delete("/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ message: "Invalid student ID." });
        return;
    }

    const result = deleteStudent(id);
    res.status(result.status).json(result.body);
});

router.post("/bulk", (req: Request, res: Response) => {
    const result = bulkInsertStudents(req.body.students);
    res.status(result.status).json(result.body);
});

router.patch("/bulk", (req: Request, res: Response) => {
    const result = bulkUpdateStudents(req.body.students);
    res.status(result.status).json(result.body);
});

router.delete("/bulk", (req: Request, res: Response) => {
    const result = bulkDeleteStudents(req.body.ids);
    res.status(result.status).json(result.body);
});

export default router;