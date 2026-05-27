import {
  canSend,
  getEmailTemplatesForAdmin,
} from "./email-policy-service";
import {
  listEmailOutboxForAdmin,
  processEmailOutbox,
  queueAdminNewOrderAlertEmailsForOrder,
  queueAppreciationAfterDeliveryEmail,
  queueEmail,
  queueManualEmail,
  queueOrderConfirmationEmailForOrder,
  queuePurchaseInvoiceEmailForOrder,
  retryFailedEmail,
  sendQueuedEmail,
  upsertEmailTemplateForAdmin,
} from "./email-service";
import {
  applySubjectTemplate,
  getRegisteredEmailTemplate,
  getRegisteredEmailTemplates,
  renderEmailTemplate,
} from "./email-template-service";

export {
  canSend,
  getEmailTemplatesForAdmin,
  type EmailPolicyDecision,
} from "./email-policy-service";
export {
  emailOutboxIdParamSchema,
  emailOutboxListQuerySchema,
  emailOutboxProcessSchema,
  emailTemplateKeySchema,
  emailTemplateParamSchema,
  emailTemplateUpdateSchema,
  manualEmailQueueSchema,
  type EmailTemplateUpdateInput,
  type ManualEmailQueueInput,
} from "./email-schemas";
export {
  listEmailOutboxForAdmin,
  processEmailOutbox,
  queueAdminNewOrderAlertEmailsForOrder,
  queueAppreciationAfterDeliveryEmail,
  queueEmail,
  queueManualEmail,
  queueOrderConfirmationEmailForOrder,
  queuePurchaseInvoiceEmailForOrder,
  retryFailedEmail,
  sendQueuedEmail,
  upsertEmailTemplateForAdmin,
  type EmailOutboxRecord,
  type EmailOrderForQueue,
  type EmailSendResult,
  type QueueEmailInput,
} from "./email-service";
export {
  applySubjectTemplate,
  getRegisteredEmailTemplate,
  getRegisteredEmailTemplates,
  renderEmailTemplate,
  type RegisteredEmailTemplate,
  type RenderedEmailTemplate,
} from "./email-template-service";
export {
  sendEmailWithResend,
  type ResendEmailInput,
  type ResendEmailResult,
} from "./resend-client";

export const EmailService = {
  listEmailOutboxForAdmin,
  processEmailOutbox,
  queueAdminNewOrderAlertEmailsForOrder,
  queueAppreciationAfterDeliveryEmail,
  queueEmail,
  queueManualEmail,
  queueOrderConfirmationEmailForOrder,
  queuePurchaseInvoiceEmailForOrder,
  retryFailedEmail,
  sendQueuedEmail,
  upsertEmailTemplateForAdmin,
};

export const EmailTemplateService = {
  applySubjectTemplate,
  getRegisteredEmailTemplate,
  getRegisteredEmailTemplates,
  renderTemplate: renderEmailTemplate,
};

export const EmailPolicyService = {
  canSend,
  getEmailTemplatesForAdmin,
};
