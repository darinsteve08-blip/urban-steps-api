package com.urbansteps.urban_steps_api.service;

import com.urbansteps.urban_steps_api.model.DetallePedido;
import com.urbansteps.urban_steps_api.model.Pedido;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String remitente;

    private final NumberFormat formatoMoneda = NumberFormat.getCurrencyInstance(new Locale("es", "CO"));

    private boolean isSmtpConfigurado() {
        return mailSender != null && remitente != null && !remitente.trim().isEmpty();
    }

    @Async
    public void enviarConfirmacionPedido(Pedido pedido) {
        if (pedido == null || pedido.getEmailCliente() == null || pedido.getEmailCliente().isBlank()) {
            return;
        }

        String asunto = "¡Confirmación de tu Pedido #" + pedido.getId() + " - Urban Steps!";
        String contenidoHtml = construirHtmlConfirmacionPedido(pedido);

        enviarHtml(pedido.getEmailCliente(), asunto, contenidoHtml, "Confirmación de Pedido #" + pedido.getId());
    }

    @Async
    public void enviarActualizacionEstado(Pedido pedido, String nuevoEstado) {
        if (pedido == null || pedido.getEmailCliente() == null || pedido.getEmailCliente().isBlank()) {
            return;
        }

        String estadoTexto = formatearNombreEstado(nuevoEstado);
        String asunto = "Actualización de tu Pedido #" + pedido.getId() + ": " + estadoTexto + " - Urban Steps";
        String contenidoHtml = construirHtmlActualizacionEstado(pedido, estadoTexto);

        enviarHtml(pedido.getEmailCliente(), asunto, contenidoHtml, "Actualización Estado Pedido #" + pedido.getId());
    }

    @Async
    public void enviarNotificacionDespacho(Pedido pedido) {
        if (pedido == null || pedido.getEmailCliente() == null || pedido.getEmailCliente().isBlank()) {
            return;
        }

        String asunto = "¡Tu Pedido #" + pedido.getId() + " va en camino! Guía de rastreo - Urban Steps";
        String contenidoHtml = construirHtmlDespacho(pedido);

        enviarHtml(pedido.getEmailCliente(), asunto, contenidoHtml, "Despacho Pedido #" + pedido.getId());
    }

    private void enviarHtml(String destinatario, String asunto, String html, String tipoEvento) {
        if (!isSmtpConfigurado()) {
            System.out.println(">>> [CORREO SIMULADO (SMTP no configurado)] " + tipoEvento + " -> Para: " + destinatario + " | Asunto: " + asunto);
            return;
        }

        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setFrom(remitente, "Urban Steps Zapatillas");
            helper.setTo(destinatario);
            helper.setSubject(asunto);
            helper.setText(html, true);

            mailSender.send(mensaje);
            System.out.println(">>> [CORREO ENVIADO EXITOSAMENTE] " + tipoEvento + " a " + destinatario);
        } catch (Exception e) {
            System.err.println(">>> [AVISO ENVÍO CORREO] No se pudo enviar el correo (" + tipoEvento + ") a " + destinatario + ": " + e.getMessage());
        }
    }

    private String formatearNombreEstado(String estado) {
        if (estado == null) return "Actualizado";
        switch (estado.toUpperCase().trim()) {
            case "PENDIENTE": return "Pendiente de Pago";
            case "PAGADO": return "Pago Confirmado";
            case "EN_CAMINO":
            case "ENVIADO": return "En Camino / Despachado";
            case "ENTREGADO": return "Entregado";
            case "CANCELADO": return "Cancelado";
            default: return estado;
        }
    }

    private String formatearDinero(Double valor) {
        if (valor == null) return "$0 COP";
        return "$" + NumberFormat.getNumberInstance(new Locale("es", "CO")).format(Math.round(valor)) + " COP";
    }

    private String construirHtmlConfirmacionPedido(Pedido p) {
        StringBuilder filasProductos = new StringBuilder();
        if (p.getProductos() != null) {
            for (DetallePedido dp : p.getProductos()) {
                String nombre = dp.getNombreProducto() != null ? dp.getNombreProducto() : "Zapatilla Urban Steps #" + dp.getProductoId();
                String talla = dp.getTalla() != null && !dp.getTalla().isBlank() ? " · Talla: " + dp.getTalla() : "";
                String color = dp.getColor() != null && !dp.getColor().isBlank() ? " · Color: " + dp.getColor() : "";
                String variantes = (talla + color).startsWith(" · ") ? (talla + color).substring(3) : (talla + color);
                double subtotal = (dp.getPrecioUnitario() != null ? dp.getPrecioUnitario() : 0.0) * (dp.getCantidad() != null ? dp.getCantidad() : 1);

                filasProductos.append("<tr>")
                    .append("<td style='padding: 12px; border-bottom: 1px solid #f1f5f9;'><strong>").append(nombre).append("</strong><br><span style='color:#64748b; font-size:13px;'>").append(variantes).append("</span></td>")
                    .append("<td style='padding: 12px; border-bottom: 1px solid #f1f5f9; text-align:center;'>").append(dp.getCantidad() != null ? dp.getCantidad() : 1).append("</td>")
                    .append("<td style='padding: 12px; border-bottom: 1px solid #f1f5f9; text-align:right;'>").append(formatearDinero(subtotal)).append("</td>")
                    .append("</tr>");
            }
        }

        String fechaStr = p.getFechaCreacion() != null
            ? p.getFechaCreacion().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
            : "Reciente";

        String bloquePagoManual = "";
        String metodo = p.getMetodoPago() != null ? p.getMetodoPago().trim() : "";
        if ("Nequi".equalsIgnoreCase(metodo) || "Daviplata".equalsIgnoreCase(metodo) || "Bancolombia".equalsIgnoreCase(metodo)) {
            bloquePagoManual =
                "<div style='background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px; padding: 14px 18px; margin: 18px 0;'>" +
                "  <strong style='color: #065f46; font-size: 15px;'>📲 Datos para Transferencia (" + metodo + "):</strong><br>" +
                "  <span style='color: #047857; font-size: 14px;'>Número / Línea Oficial: <strong>313 804 4913</strong> (Urban Steps)</span><br>" +
                "  <span style='color: #475569; font-size: 13px;'>Envía el comprobante de tu transferencia por WhatsApp para verificar y despachar tus zapatillas de inmediato.</span>" +
                "</div>";
        }

        return "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'></head>" +
            "<body style='font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;'>" +
            "  <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);'>" +
            "    <div style='background: #111827; padding: 28px; text-align: center; border-bottom: 4px solid #FF5722;'>" +
            "      <h1 style='margin: 0; color: #ffffff; font-size: 26px; font-weight: bold;'>Urban<span style='color: #FF5722;'>Steps</span></h1>" +
            "      <p style='margin: 6px 0 0 0; color: #94a3b8; font-size: 14px;'>Tu tienda de zapatillas favorita</p>" +
            "    </div>" +
            "    <div style='padding: 30px;'>" +
            "      <h2 style='color: #111827; margin-top: 0;'>¡Gracias por tu compra, " + p.getNombreCliente() + "! 🎉</h2>" +
            "      <p style='color: #475569; font-size: 15px; line-height: 1.6;'>Hemos registrado tu orden con éxito. A continuación encontrarás el resumen detallado de tu pedido:</p>" +
            "      <div style='background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0;'>" +
            "        <p style='margin: 4px 0;'><strong>Número de Pedido:</strong> #" + p.getId() + "</p>" +
            "        <p style='margin: 4px 0;'><strong>Fecha:</strong> " + fechaStr + "</p>" +
            "        <p style='margin: 4px 0;'><strong>Método de Pago:</strong> " + (p.getMetodoPago() != null ? p.getMetodoPago() : "Manual / WhatsApp") + "</p>" +
            "        <p style='margin: 4px 0;'><strong>Dirección de Entrega:</strong> " + (p.getDireccion() != null ? p.getDireccion() : "Por coordinar") + " (" + (p.getCiudad() != null ? p.getCiudad() : "") + ")</p>" +
            "      </div>" +
            "      <table style='width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;'>" +
            "        <thead>" +
            "          <tr style='background: #f8fafc; color: #64748b; text-align: left;'>" +
            "            <th style='padding: 10px 12px;'>Producto</th>" +
            "            <th style='padding: 10px 12px; text-align:center;'>Cant.</th>" +
            "            <th style='padding: 10px 12px; text-align:right;'>Subtotal</th>" +
            "          </tr>" +
            "        </thead>" +
            "        <tbody>" + filasProductos.toString() + "</tbody>" +
            "      </table>" +
            "      <div style='text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; color: #FF5722;'>" +
            "        Total: " + formatearDinero(p.getTotal()) + "" +
            "      </div>" +
            bloquePagoManual +
            "      <div style='margin-top: 26px; text-align: center;'>" +
            "        <a href='https://wa.me/573138044913?text=Hola%2C%20acabo%20de%20hacer%20el%20pedido%20%23" + p.getId() + "' style='background: #25D366; color: white; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; display: inline-block;'>📱 Reportar Pago / Asistencia por WhatsApp</a>" +
            "      </div>" +
            "    </div>" +
            "    <div style='background: #f8fafc; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;'>" +
            "      Urban Steps Colombia © 2026 · Atención al cliente: +57 313 804 4913" +
            "    </div>" +
            "  </div>" +
            "</body></html>";
    }

    private String construirHtmlActualizacionEstado(Pedido p, String estadoTexto) {
        return "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'></head>" +
            "<body style='font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;'>" +
            "  <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);'>" +
            "    <div style='background: #111827; padding: 26px; text-align: center; border-bottom: 4px solid #FF5722;'>" +
            "      <h1 style='margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;'>Urban<span style='color: #FF5722;'>Steps</span></h1>" +
            "    </div>" +
            "    <div style='padding: 30px;'>" +
            "      <h2 style='color: #111827; margin-top: 0;'>¡Novedades de tu Pedido #" + p.getId() + "!</h2>" +
            "      <p style='color: #475569; font-size: 15px;'>Hola <strong>" + p.getNombreCliente() + "</strong>,</p>" +
            "      <p style='color: #475569; font-size: 15px; line-height: 1.6;'>Te informamos que el estado de tu pedido ha cambiado a:</p>" +
            "      <div style='text-align: center; margin: 25px 0;'>" +
            "        <span style='background: #FF5722; color: #ffffff; font-size: 18px; font-weight: bold; padding: 12px 28px; border-radius: 30px; display: inline-block;'>" + estadoTexto + "</span>" +
            "      </div>" +
            "      <p style='color: #475569; font-size: 14px; line-height: 1.6;'>Puedes rastrear todos los detalles de tu compra ingresando a tu perfil en nuestra tienda o escribiéndonos por WhatsApp.</p>" +
            "      <div style='margin-top: 25px; text-align: center;'>" +
            "        <a href='https://wa.me/573138044913?text=Hola%2C%20deseo%20consultar%20mi%20pedido%20%23" + p.getId() + "' style='background: #111827; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-block;'>💬 Contactar Soporte</a>" +
            "      </div>" +
            "    </div>" +
            "    <div style='background: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;'>" +
            "      Urban Steps Colombia · Soporte WhatsApp: 313 804 4913" +
            "    </div>" +
            "  </div>" +
            "</body></html>";
    }

    private String construirHtmlDespacho(Pedido p) {
        String transportadora = p.getTransportadora() != null ? p.getTransportadora() : "Transportadora Nacional";
        String guia = p.getNumeroGuia() != null ? p.getNumeroGuia() : "Pendiente por asignar";

        return "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'></head>" +
            "<body style='font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;'>" +
            "  <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);'>" +
            "    <div style='background: #111827; padding: 26px; text-align: center; border-bottom: 4px solid #16a34a;'>" +
            "      <h1 style='margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;'>Urban<span style='color: #FF5722;'>Steps</span></h1>" +
            "    </div>" +
            "    <div style='padding: 30px;'>" +
            "      <h2 style='color: #16a34a; margin-top: 0;'>🚚 ¡Tus Zapatillas van en Camino!</h2>" +
            "      <p style='color: #475569; font-size: 15px;'>Hola <strong>" + p.getNombreCliente() + "</strong>,</p>" +
            "      <p style='color: #475569; font-size: 15px; line-height: 1.6;'>Tu pedido #" + p.getId() + " ha sido empaquetado y despachado con éxito. Aquí tienes los datos de tu guía para hacerle seguimiento:</p>" +
            "      <div style='background: #f1f5f9; border-left: 4px solid #16a34a; border-radius: 8px; padding: 18px; margin: 20px 0;'>" +
            "        <p style='margin: 4px 0;'><strong>Transportadora:</strong> " + transportadora + "</p>" +
            "        <p style='margin: 4px 0;'><strong>Número de Guía:</strong> <span style='font-family: monospace; font-size: 16px; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;'>" + guia + "</span></p>" +
            "        <p style='margin: 4px 0;'><strong>Dirección de Destino:</strong> " + (p.getDireccion() != null ? p.getDireccion() : "") + " (" + (p.getCiudad() != null ? p.getCiudad() : "") + ")</p>" +
            "      </div>" +
            "      <p style='color: #64748b; font-size: 14px;'>El paquete debería llegar a tu dirección en un lapso estimado de 1 a 3 días hábiles.</p>" +
            "    </div>" +
            "    <div style='background: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;'>" +
            "      Urban Steps Colombia · Soporte WhatsApp: 313 804 4913" +
            "    </div>" +
            "  </div>" +
            "</body></html>";
    }
}
