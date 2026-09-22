import { cn } from "@/common/lib/utils";
import { fieldError, iconButton } from "@/common/styles";
import { formatDateTime, getErrorMessage } from "@/core/api";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Note } from "../api/notes";
import { useDeleteNote } from "../hooks/useDeleteNote";
import { useUpdateNote } from "../hooks/useUpdateNote";
import { NoteForm } from "./NoteForm";

/** Notes with inline edit + delete. Actions freeze while a mutation is in flight. */
export const NoteList = ({ notes }: { notes: Note[] }) => {
  const { t, i18n } = useTranslation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const mutating = updateNote.isPending || deleteNote.isPending;

  return (
    <div>
      <ul className="mt-6 divide-y">
        {notes.map((note) =>
          editingId === note.id ? (
            <li key={note.id} className="py-5">
              <NoteForm
                defaultValues={{ title: note.title, content: note.content }}
                submitLabel={t("notes.form.save")}
                onSubmit={async (values) => {
                  await updateNote.mutateAsync({ id: note.id, patch: values });
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={note.id}
              className="flex items-start justify-between gap-6 py-5"
            >
              <div className="min-w-0">
                <p className="font-medium">{note.title}</p>
                {note.content && (
                  <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                    {note.content}
                  </p>
                )}
                <p className="text-muted-foreground/70 mt-2 font-mono text-[11px]">
                  {t("notes.list.updatedAt", {
                    date: formatDateTime(note.updated_at, i18n.language),
                  })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(note.id)}
                  disabled={mutating}
                  className={cn(
                    iconButton,
                    "disabled:pointer-events-none disabled:opacity-40"
                  )}
                  aria-label={t("notes.list.edit")}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteNote.mutate(note.id)}
                  disabled={mutating}
                  className={cn(
                    iconButton,
                    "hover:border-destructive hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                  )}
                  aria-label={t("notes.list.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          )
        )}
      </ul>
      {deleteNote.isError && (
        <p className={fieldError + " mt-2"}>
          {getErrorMessage(deleteNote.error)}
        </p>
      )}
    </div>
  );
};
