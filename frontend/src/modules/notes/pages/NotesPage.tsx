import { Footer, Page, Section, Stack } from "@/common/components/layout";
import { Button } from "@/common/components/ui";
import { fieldError, inlineLink } from "@/common/styles";
import { getErrorMessage } from "@/core/api";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { NoteForm } from "../components/NoteForm";
import { NoteList } from "../components/NoteList";
import { Pagination } from "../components/Pagination";
import { useCreateNote } from "../hooks/useCreateNote";
import { useNotes } from "../hooks/useNotes";

const PAGE_SIZE = 10;

export const NotesPage = () => {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const notesQuery = useNotes({ limit: PAGE_SIZE, offset });
  const createNote = useCreateNote();

  const page = notesQuery.data;

  // After deleting the last note of a trailing page, step back so the view isn't empty.
  useEffect(() => {
    if (
      page &&
      !notesQuery.isPlaceholderData &&
      page.total > 0 &&
      page.items.length === 0 &&
      offset > 0
    ) {
      setOffset(Math.max(0, offset - PAGE_SIZE));
    }
  }, [page, notesQuery.isPlaceholderData, offset]);

  return (
    <Page>
      <Section divider={false}>
        <Stack gap="lg">
          <Link to="/" className={inlineLink}>
            <ArrowLeft className="h-3 w-3" />
            {t("goHome")}
          </Link>
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
            {t("notes.title")}
          </h1>
          <p className="text-muted-foreground max-w-xl text-base">
            {t("notes.description")}
          </p>
        </Stack>
      </Section>

      <Section label={t("notes.create.label")} delay={0.1}>
        <NoteForm
          className="mt-8"
          submitLabel={t("notes.form.create")}
          onSubmit={(values) => createNote.mutateAsync(values)}
        />
      </Section>

      <Section label={t("notes.list.label")} delay={0.2}>
        {notesQuery.isPending ? (
          <p className="text-muted-foreground mt-6 text-sm">
            {t("notes.list.loading")}
          </p>
        ) : notesQuery.isError ? (
          <Stack gap="md" className="mt-6">
            <p className={fieldError}>{getErrorMessage(notesQuery.error)}</p>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void notesQuery.refetch()}
              >
                {t("notes.list.retry")}
              </Button>
            </div>
          </Stack>
        ) : page && page.total > 0 ? (
          <>
            <NoteList notes={page.items} />
            <Pagination
              className="mt-8"
              total={page.total}
              limit={PAGE_SIZE}
              offset={offset}
              onOffsetChange={setOffset}
              disabled={notesQuery.isPlaceholderData}
            />
          </>
        ) : (
          <p className="text-muted-foreground mt-6 text-sm">
            {t("notes.list.empty")}
          </p>
        )}
      </Section>

      <Footer />
    </Page>
  );
};
