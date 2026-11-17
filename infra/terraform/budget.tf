# Ver docs/backlog-salida-produccion.md punto 5: sin esto, un recurso mal
# configurado (ej. un bucle de requests, un volumen que no se borra) podia
# generar gasto inesperado sin ningun aviso. Alarma simple de AWS Budgets,
# notifica por email -- no requiere SNS, Budgets soporta subscriptor EMAIL
# directo.
variable "budget_monthly_limit_usd" {
  description = "Limite mensual de gasto en USD antes de alertar (ver ADR-020: instancia unica, costo esperado bajo)"
  type        = string
  default     = "50"
}

variable "budget_alert_email" {
  description = "Email que recibe las alertas de presupuesto"
  type        = string
  default     = "delyanave@gmail.com"
}

resource "aws_budgets_budget" "monthly" {
  name         = "obraya-${var.environment}-monthly"
  budget_type  = "COST"
  limit_amount = var.budget_monthly_limit_usd
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  # Alerta temprana: 80% del gasto real ya ejecutado.
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  # Alerta temprana basada en proyeccion (antes de llegar al limite real).
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "FORECASTED"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  # Gasto real ya supero el limite -- revisar de inmediato.
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }
}
