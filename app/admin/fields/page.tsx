"use client";
import CsvDownloadButton from "@/components/csv-download-button";

import { useState, useEffect } from "react";
import { getAcademicFields, addAcademicField, deleteAcademicField } from "@/app/actions/academic-fields";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import styles from "./fields.module.css";

export default function ManageAcademicFields() {
    const [fields, setFields] = useState<{id: string, name: string}[]>([]);
    const [newField, setNewField] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadFields();
    }, []);

    async function loadFields() {
        setLoading(true);
        const data = await getAcademicFields();
        setFields(data);
        setLoading(false);
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newField.trim()) return;

        setSubmitting(true);
        const result = await addAcademicField(newField.trim());
        setSubmitting(false);

        if (result.success) {
            toast.success("Field added successfully");
            setNewField("");
            loadFields();
        } else {
            toast.error(result.error || "Failed to add field");
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this field?")) return;

        const result = await deleteAcademicField(id);
        if (result.success) {
            toast.success("Field deleted");
            loadFields();
        } else {
            toast.error(result.error || "Failed to delete field");
        }
    }

    return (
        <div className={styles.container}>
            <h1>Manage Event Categories</h1>
            <p>Add or remove categories that can be associated with events and forms.</p>

            <form onSubmit={handleAdd} className={styles.addForm}>
                <input
                    type="text"
                    value={newField}
                    onChange={(e) => setNewField(e.target.value)}
                    placeholder="E.g., pro-dev, socials"
                    className={styles.input}
                    disabled={submitting}
                />
                <button type="submit" className={styles.addButton} disabled={submitting || !newField.trim()}>
                    <Plus size={18} /> Add Category
                </button>
            </form>

            <CsvDownloadButton filename="sase-event-categories" rows={fields} disabled={loading} label="Download categories (CSV)" />
            <div className={styles.list}>
                {loading ? (
                    <p>Loading fields...</p>
                ) : fields.length === 0 ? (
                    <p>No fields found.</p>
                ) : (
                    <ul>
                        {fields.map((field) => (
                            <li key={field.id} className={styles.listItem}>
                                <span>{field.name}</span>
                                <button
                                    onClick={() => handleDelete(field.id)}
                                    className={styles.deleteButton}
                                    aria-label="Delete field"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
