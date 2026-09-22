import { Footer, Page, Section, Stack } from "@/common/components/layout";
import { field, fieldError, fieldLabel, inlineLink } from "@/common/styles";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

type ContactFormValues = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export const ContactFormPage = () => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    defaultValues: { name: "", email: "", topic: "", message: "" },
  });

  const onSubmit = (data: ContactFormValues) => {
    console.log("Contact form submitted:", data);
    reset();
  };

  return (
    <Page>
      <Section divider={false}>
        <Stack gap="lg">
          <Link to="/" className={inlineLink}>
            <ArrowLeft className="h-3 w-3" />
            {t("goHome")}
          </Link>
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
            {t("contactForm.title")}
          </h1>
          <p className="text-muted-foreground max-w-xl text-base">
            {t("contactForm.description")}
          </p>
        </Stack>
      </Section>

      <Section label={t("contactForm.contactLabel")} delay={0.1}>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          {t("contactForm.contactTitle")}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-8">
          <Stack gap="xs">
            <label className={fieldLabel}>{t("contactForm.form.name")}</label>
            <input
              type="text"
              className={field}
              placeholder={t("contactForm.form.namePlaceholder")}
              {...register("name", {
                required: t("contactForm.form.errors.nameRequired"),
              })}
            />
            {errors.name && <p className={fieldError}>{errors.name.message}</p>}
          </Stack>

          <Stack gap="xs">
            <label className={fieldLabel}>{t("contactForm.form.email")}</label>
            <input
              type="email"
              className={field}
              placeholder={t("contactForm.form.emailPlaceholder")}
              {...register("email", {
                required: t("contactForm.form.errors.emailRequired"),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t("contactForm.form.errors.emailInvalid"),
                },
              })}
            />
            {errors.email && (
              <p className={fieldError}>{errors.email.message}</p>
            )}
          </Stack>

          <Stack gap="xs">
            <label className={fieldLabel}>{t("contactForm.form.topic")}</label>
            <input
              type="text"
              className={field}
              placeholder={t("contactForm.form.topicPlaceholder")}
              {...register("topic")}
            />
          </Stack>

          <Stack gap="xs">
            <label className={fieldLabel}>
              {t("contactForm.form.message")}
            </label>
            <textarea
              rows={4}
              className={field + " resize-none"}
              placeholder={t("contactForm.form.messagePlaceholder")}
              {...register("message", {
                required: t("contactForm.form.errors.messageRequired"),
                minLength: {
                  value: 10,
                  message: t("contactForm.form.errors.messageTooShort"),
                },
              })}
            />
            {errors.message && (
              <p className={fieldError}>{errors.message.message}</p>
            )}
          </Stack>

          <div className="flex items-center justify-between pt-2">
            <p className="text-muted-foreground font-mono text-[11px]">
              {t("contactForm.form.hint")}
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group text-primary inline-flex items-center gap-2 font-mono text-sm font-medium transition-opacity disabled:opacity-50"
            >
              {isSubmitting
                ? t("contactForm.form.sending")
                : t("contactForm.form.send")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </form>
      </Section>

      <Footer />
    </Page>
  );
};
