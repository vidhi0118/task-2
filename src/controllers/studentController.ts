
import fs from "fs";
import path from "path";
import { Student } from "../types/student";

const dataFile = path.join(process.cwd(), "data", "students.json");

export const getStudents = (): Student[] => {
    if (!fs.existsSync(dataFile)) {
        fs.mkdirSync(path.dirname(dataFile), { recursive: true });
        fs.writeFileSync(dataFile, "[]", "utf-8");
    }

    const data = fs.readFileSync(dataFile, "utf-8");
    return JSON.parse(data) as Student[];
};

export const saveStudents = (students: Student[]): void => {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(students, null, 2), "utf-8");
};

const validateStudent = (student: any): string | null => {
    if (!student || typeof student !== "object" || Array.isArray(student)) {
        return "Each student must be an object.";
    }

    const required = [
        "studentName", "enrollmentNo", "email", "mobile",
        "dateOfBirth", "age", "gender", "course",
        "specialization", "semester", "address", "city",
        "state", "skills", "hobbies"
    ];

    for (const field of required) {
        if (student[field] === undefined || student[field] === null ||
            student[field] === "") {
            return `${field} is required.`;
        }
    }

    if (typeof student.studentName !== "string" ||
        student.studentName.trim().length < 2 ||
        student.studentName.trim().length > 50) {
        return "Student name must contain 2 to 50 characters.";
    }

    if (typeof student.enrollmentNo !== "string" ||
        !student.enrollmentNo.trim()) {
        return "Enrollment number must be a non-empty string.";
    }

    if (typeof student.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
        return "Enter a valid email address.";
    }

    if (typeof student.mobile !== "string" ||
        !/^\d{10}$/.test(student.mobile)) {
        return "Mobile number must contain exactly 10 digits.";
    }

    if (!Number.isInteger(student.age) || student.age < 18 || student.age > 60) {
        return "Age must be between 18 and 60.";
    }

    if (!Number.isInteger(student.semester) ||
        student.semester < 1 || student.semester > 6) {
        return "Semester must be between 1 and 6.";
    }

    if (!["Male", "Female", "Other"].includes(student.gender)) {
        return "Gender must be Male, Female, or Other.";
    }

    if (!Array.isArray(student.skills) || student.skills.length < 1 ||
        !student.skills.every((x: unknown) => typeof x === "string" && x.trim())) {
        return "Provide at least one valid skill.";
    }

    if (!Array.isArray(student.hobbies) || student.hobbies.length < 1 ||
        !student.hobbies.every((x: unknown) => typeof x === "string" && x.trim())) {
        return "Provide at least one valid hobby.";
    }

    if (student.passportPhoto !== undefined &&
        typeof student.passportPhoto !== "string") {
        return "passportPhoto must be a string when provided.";
    }

    return null;
};

const checkUniqueFields = (
    students: Student[],
    incoming: any[],
    ignoredIds: Set<number> = new Set()
): string | null => {
    const enrollments = new Set<string>();
    const emails = new Set<string>();

    for (const student of students) {
        if (ignoredIds.has(student.id)) continue;

        const enrollment = student.enrollmentNo.toLowerCase();
        const email = student.email.toLowerCase();

        enrollments.add(enrollment);
        emails.add(email);
    }

    for (const student of incoming) {
        const enrollment = String(student.enrollmentNo).trim().toLowerCase();
        const email = String(student.email).trim().toLowerCase();

        if (enrollments.has(enrollment)) {
            return `Enrollment number already exists: ${student.enrollmentNo}`;
        }
        if (emails.has(email)) {
            return `Email already exists: ${student.email}`;
        }

        enrollments.add(enrollment);
        emails.add(email);
    }

    return null;
};


export const insertStudent = (student: any) => {
    const error = validateStudent(student);
    if (error) return { status: 400, body: { message: error } };

    const students = getStudents();
    const uniqueError = checkUniqueFields(students, [student]);

    if (uniqueError) {
        return { status: 409, body: { message: uniqueError } };
    }

    const newStudent: Student = { ...student, id: Date.now() };
    students.push(newStudent);
    saveStudents(students);

    return {
        status: 201,
        body: { message: "Student inserted successfully.", student: newStudent }
    };
};


export const listStudents = () => ({
    status: 200,
    body: getStudents()
});


export const findStudent = (id: number) => {
    const student = getStudents().find(s => s.id === id);

    return student
        ? { status: 200, body: student }
        : { status: 404, body: { message: "Student not found." } };
};


export const updateStudent = (id: number, updates: any) => {
    const students = getStudents();
    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
        return { status: 404, body: { message: "Student not found." } };
    }

    if (updates.id !== undefined && updates.id !== id) {
        return { status: 400, body: { message: "Student ID cannot be changed." } };
    }

    const updated = { ...students[index], ...updates, id };
    const error = validateStudent(updated);

    if (error) return { status: 400, body: { message: error } };

    const uniqueError = checkUniqueFields(students, [updated], new Set([id]));
    if (uniqueError) {
        return { status: 409, body: { message: uniqueError } };
    }

    students[index] = updated;
    saveStudents(students);

    return { status: 200, body: { message: "Student updated successfully.", student: updated } };
};

export const deleteStudent = (id: number) => {
    const students = getStudents();
    const remaining = students.filter(s => s.id !== id);

    if (remaining.length === students.length) {
        return { status: 404, body: { message: "Student not found." } };
    }

    saveStudents(remaining);
    return { status: 200, body: { message: "Student deleted successfully." } };
};

export const bulkInsertStudents = (incoming: any) => {
    if (!Array.isArray(incoming) || incoming.length === 0) {
        return { status: 400, body: { message: "Send a non-empty students array." } };
    }

    const errors = incoming.map((student, index) => {
        const error = validateStudent(student);
        return error ? `Student ${index + 1}: ${error}` : null;
    }).filter(Boolean);

    if (errors.length) {
        return { status: 400, body: { message: "Validation failed.", errors } };
    }

    const students = getStudents();
    const uniqueError = checkUniqueFields(students, incoming);

    if (uniqueError) {
        return { status: 409, body: { message: uniqueError } };
    }

    const now = Date.now();
    const newStudents: Student[] = incoming.map((student, index) => ({
        ...student,
        id: now + index
    }));

    saveStudents([...students, ...newStudents]);

    return {
        status: 201,
        body: {
            message: `${newStudents.length} students inserted successfully.`,
            students: newStudents
        }
    };
};

export const bulkUpdateStudents = (incoming: any) => {
    if (!Array.isArray(incoming) || incoming.length === 0) {
        return { status: 400, body: { message: "Send a non-empty students array." } };
    }

    const students = getStudents();
    const ids = incoming.map(s => s?.id);

    if (ids.some(id => !Number.isInteger(id)) ||
        new Set(ids).size !== ids.length) {
        return {
            status: 400,
            body: { message: "Each update needs a unique numeric id." }
        };
    }

    if (ids.some((id: number) => !students.some(s => s.id === id))) {
        return {
            status: 404,
            body: { message: "One or more student IDs were not found. No records updated." }
        };
    }

    const updatedStudents = students.map(existing => {
        const change = incoming.find((s: any) => s.id === existing.id);
        return change ? { ...existing, ...change, id: existing.id } : existing;
    });

    const updatedRecords = updatedStudents.filter(s => ids.includes(s.id));

    for (let i = 0; i < updatedRecords.length; i++) {
        const error = validateStudent(updatedRecords[i]);
        if (error) {
            return {
                status: 400,
                body: { message: `Student ID ${updatedRecords[i].id}: ${error}` }
            };
        }
    }

    const uniqueError = checkUniqueFields(
        updatedStudents.filter(s => !ids.includes(s.id)),
        updatedRecords
    );

    if (uniqueError) {
        return { status: 409, body: { message: uniqueError } };
    }

    saveStudents(updatedStudents);

    return {
        status: 200,
        body: {
            message: `${updatedRecords.length} students updated successfully.`,
            students: updatedRecords
        }
    };
};

export const bulkDeleteStudents = (ids: any) => {
    if (!Array.isArray(ids) || ids.length === 0 ||
        !ids.every(id => Number.isInteger(id)) ||
        new Set(ids).size !== ids.length) {
        return {
            status: 400,
            body: { message: "Send a non-empty ids array containing unique numeric IDs." }
        };
    }

    const students = getStudents();
    const deleted = students.filter(s => ids.includes(s.id));
    const remaining = students.filter(s => !ids.includes(s.id));
    const foundIds = new Set(deleted.map(s => s.id));
    const notFoundIds = ids.filter((id: number) => !foundIds.has(id));

    if (deleted.length === 0) {
        return {
            status: 404,
            body: { message: "No matching students found.", notFoundIds }
        };
    }

    saveStudents(remaining);

    return {
        status: 200,
        body: {
            message: `${deleted.length} students deleted successfully.`,
            deletedIds: deleted.map(s => s.id),
            notFoundIds
        }
    };
};