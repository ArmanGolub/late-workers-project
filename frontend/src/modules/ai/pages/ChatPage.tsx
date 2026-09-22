import { Footer, Page, Section, Stack } from "@/common/components/layout";
import { inlineLink } from "@/common/styles";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ChatPanel } from "../components/ChatPanel";

export const ChatPage = () => {
  const { t } = useTranslation();

  return (
    <Page>
      <Section divider={false}>
        <Stack gap="lg">
          <Link to="/" className={inlineLink}>
            <ArrowLeft className="h-3 w-3" />
            {t("goHome")}
          </Link>
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
            {t("ai.page.title")}
          </h1>
          <p className="text-muted-foreground max-w-xl text-base">
            {t("ai.page.description")}
          </p>
        </Stack>
      </Section>

      <Section label={t("ai.page.sessionLabel")} delay={0.1}>
        <div className="mt-8">
          <ChatPanel />
        </div>
      </Section>

      <Footer />
    </Page>
  );
};
