# 🚀 GUÍA COMPLETA: Desplegar Urban Steps en la Nube
## (Aprende paso a paso - Español)

---

## 📚 PARTE 1: CONCEPTOS BÁSICOS (¡IMPORTANTE ENTENDER!)

Antes de tocar botones, vamos a entender **qué** vamos a hacer y **por qué**.

### 1.1 ¿Cómo funciona mi e-commerce Urban Steps? (Las 3 piezas)

Tu proyecto tiene **TRES PARTES** que deben trabajar juntas:

| Pieza | ¿Qué es? | ¿Dónde vive en tu PC? | ¿Qué hace? |
|-------|----------|------------------------|------------|
| 🎨 **Frontend** | Páginas web que ve el usuario (HTML/CSS/JS) | `src/main/resources/static/` | Mostrar zapatos, carrito, formularios de login |
| ⚙️ **Backend** | Lógica de negocio (Java Spring Boot) | `src/main/java/...` | Calcular precios, guardar pedidos, validar login |
| 💾 **Base de Datos (BD)** | Donde se guardan los datos PERMANENTEMENTE | MySQL local en tu PC (`localhost:3306`) | Guardar productos, usuarios, pedidos (no se borran al apagar) |

> 🧠 **Analogía simple**: Imagina una tienda física:
> - **Frontend** = El escaparate y la tienda donde los clientes tocan los zapatos
> - **Backend** = El empleado que atiende, cobra y anota las ventas
> - **Base de Datos** = El libro de contabilidad y el almacén (siempre está ahí)

---

### 1.2 ¿Por qué no sirve tenerlo solo en mi PC?

Tu PC es **LOCAL**:
- Solo tu lo puedes ver (en `localhost:8082`)
- Si lo apagas, la tienda se cierra
- Tus amigos/clientes NO pueden entrar desde su celular

Por eso necesitamos **subirlo a la nube** (servidores de otra empresa que siempre están encendidos).

---

### 1.3 Tipos de hosting en la nube (PaaS vs IaaS)

Existen dos formas principales de subir tu proyecto:

| Tipo | ¿Qué es? | Ejemplos | ¿Me sirve a mí? |
|------|----------|----------|-----------------|
| 🟢 **PaaS (Plataform como Service)** | Tu solo subes tu **código**, la empresa se encarga de TODO lo demás (encender servidores, instalar Java, actualizaciones de seguridad) | Render, Railway, Clever Cloud, Heroku | ✅ **SÍ - USA ESTA. Es lo más fácil para aprender** |
| 🔴 **IaaS (Infraestructura como Service)** | Te dan un servidor "vacío" (como una PC nueva) y TU debes instalar TODO (Java, MySQL, configurar redes) | AWS EC2, Google Compute Engine, DigitalOcean Droplet | ❌ NO por ahora. Demasiado complejo y propenso a errores. |

> 🎯 **Nuestra elección hoy**: Usaremos **PaaS** con dos empresas:
> - **Render** → alojar el Backend + Frontend (todo junto en un solo JAR)
> - **Clever Cloud** → alojar la Base de Datos MySQL (tienen capa gratuita generosa)

---

### 1.4 Conceptos clave que aparecerán mucho

- **🌐 Variables de Entorno (Environment Variables)**:
  Son "valores secretos" que NO quieres escribir directamente en tu código (ej: contraseña de tu BD). En vez de eso, tu app las "lee" del sistema operativo del servidor.
  ```
  Ejemplo:
  En tu código:  spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:}
  En Render configuras:  SPRING_DATASOURCE_PASSWORD = MiContraseñaSuperSegura123
  ```
  Ya configuré tu `application.properties` para usar variables de entorno automáticamente. 😊

- **📦 JAR (Java ARchive)**:
  Es un ÚNICO archivo que contiene **TODA tu aplicación** (código Java + HTML + CSS + JS). Es como un "paquete listo para usar".
  ```
  Ejemplo: urban-steps-api-0.0.1-SNAPSHOT.jar
  Para ejecutarlo: java -jar urban-steps-api-0.0.1-SNAPSHOT.jar
  ```

- **🔌 Puerto (Port)**:
  Es la "puerta" por donde tu app recibe peticiones en el servidor. En tu PC usas el `8082`, pero en Render la empresa te da uno **aleatorio** (guardado en la variable `PORT`). Ya configuré tu app para que lo use automáticamente.

---

## 🛠️ PARTE 2: PREPARACIÓN PREVIA

### 2.1 Tener tu código en GitHub (¡OBLIGATORIO para Render!)

Render necesita "leer" tu código desde GitHub. Si aún no lo tienes:

1. Ve a https://github.com y crea una cuenta (gratis).
2. Crea un nuevo **repositorio** (proyecto) llamado `urban-steps-api`.
3. Sube tu carpeta del proyecto a GitHub (puedes usar GitHub Desktop o la terminal).

> 💡 **Ayuda rápida terminal**: En la carpeta de tu proyecto:
> ```bash
> git init
> git add .
> git commit -m "Proyecto Urban Steps listo para despliegue"
> git branch -M main
> git remote add origin https://github.com/TU_USUARIO/urban-steps-api.git
> git push -u origin main
> ```

---

## 💾 PASO 1: Crear Base de Datos en Clever Cloud (MySQL Gratuito)

Primero necesitamos una **Base de Datos MySQL pública** (no la de tu PC, porque Render no puede ver tu localhost). Usaremos **Clever Cloud** porque tiene capa gratuita.

### 1.1 Crear cuenta Clever Cloud
1. Abre: https://www.clever-cloud.com/
2. Clic en **Sign Up** (Registrarse)
3. Puedes usar GitHub, Google o tu email.
4. Confirma tu email si te lo piden.

### 1.2 Crear la instancia de MySQL
1. En el Dashboard de Clever Cloud, clic en **Create** → **Add-on**.
2. Busca y selecciona **MySQL**.
3. Elige el plan:
   - ✅ **DEV** (Gratis - 256 MB almacenamiento, suficiente para aprender)
4. Dale un nombre: `urban-steps-db` (o el que quieras)
5. Clic en **Next** → **Create this addon**

### 1.3 Copiar las credenciales (¡MUY IMPORTANTE GUARDARLAS!)
Espera ~2 minutos a que termine de crearse. Luego verás una sección de **Connection info** o **Environment variables**. **COPIA Y PEGA ESTOS DATOS en un bloc de notas**:

```
📋 TEN ESTO LISTO PARA LUEGO:

MYSQL_ADDON_HOST      = (ej: bt...clever-cloud.com)      ← Host/Servidor
MYSQL_ADDON_PORT      = (ej: 3306)                        ← Puerto (normalmente 3306)
MYSQL_ADDON_DB        = (ej: bq...urban_steps)           ← Nombre de la BD
MYSQL_ADDON_USER      = (ej: ur...admin)                 ← Usuario
MYSQL_ADDON_PASSWORD  = (ej: sUper_Secret_Pass_123)      ← Contraseña (LA MÁS IMPORTANTE)
```

### 1.4 Formatear la URL JDBC (para luego en Render)
Necesitamos armar la URL completa que usará Spring. Usa esta plantilla:

```
jdbc:mysql://<<HOST>>:<<PUERTO>>/<<NOMBRE_BD>>?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true
```

**Ejemplo con datos inventados**:
```
jdbc:mysql://btswdb.clever-cloud.com:3306/bqurban_steps?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true
```

> 📝 Guarda esta URL completa. La necesitarás en el siguiente paso.

---

## ⚙️ PASO 2: Desplegar tu App en Render (Backend + Frontend juntos)

Ahora subiremos la aplicación Spring Boot (que ya incluye las páginas HTML del frontend) a **Render**, conectándola a tu GitHub y a la BD que acabas de crear en Clever Cloud.

### 2.1 Crear cuenta Render
1. Abre: https://render.com/
2. Clic en **Get Started** → Regístrate con **GitHub** (más fácil, luego se conecta automáticamente).
3. Autoriza a Render para ver tus repositorios de GitHub.

### 2.2 Crear un nuevo Web Service
1. En el Dashboard de Render, clic en el botón **+ New** → **Web Service**
2. En la lista de repositorios, elige el tuyo: `TU_USUARIO/urban-steps-api`
3. Clic en **Connect**

### 2.3 Configurar el Web Service (parte visual)
Llenarás este formulario (sigue la tabla al pie de la letra):

| Campo | Valor a poner | Explicación |
|-------|----------------|-------------|
| **Name (Nombre)** | `urban-steps` (o el que quieras, será tu URL!) | Será parte de tu dominio: `urban-steps.onrender.com` |
| **Region** | `Virginia (US East)` o la más cercana a ti | Elige una cerca de tu país para que sea más rápido. |
| **Branch (Rama)** | `main` | La rama de GitHub que subiste. |
| **Runtime (Tiempo de ejecución)** | ✅ **Docker? NO → Elige JAVA** | Render detecta automáticamente `system.properties` (el archivo que creamos con java.runtime.version=17) y usará Java 17. |
| **Build Command** | `./mvnw clean package -DskipTests` | ⚠️ IMPORTANTE: Este comando MAVEN compila tu código y genera el archivo `.jar` final. Saltamos tests para acelerar. |
| **Start Command** | `java -jar target/*.jar` | Ejecuta el JAR que acabamos de construir con el build. Usa el `PORT` que Render provee automáticamente. |
| **Plan** | ✅ **Free** (gratis) | Puedes cambiarlo luego si tu tienda crece mucho. |

### 2.4 Configurar VARIABLES DE ENTORNO (¡La parte más delicada!)
Clic en el botón **Advanced** (Avanzado) → luego en **+ Add Environment Variable** y agrega las siguientes 5 variables:

| KEY (Nombre Variable) | VALUE (Valor) |
|------------------------|----------------|
| `SPRING_PROFILES_ACTIVE` | `prod` | Le dice a Spring que use `application-prod.properties` (seguridad de producción) |
| `SPRING_DATASOURCE_URL` | La URL JDBC que armaste en Paso 1.4 (ej: `jdbc:mysql://btswdb.clever-cloud.com:3306/bqurban_steps?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true`) |
| `SPRING_DATASOURCE_USERNAME` | Tu usuario Clever Cloud (valor de `MYSQL_ADDON_USER`) |
| `SPRING_DATASOURCE_PASSWORD` | Tu contraseña Clever Cloud (valor de `MYSQL_ADDON_PASSWORD`) |
| `PORT` | `10000` | Render lo sugiere, pero lo toma automáticamente. Puedes poner este valor por defecto. |

> 🔐 **SEGURIDAD**: Estas credenciales NUNCA se verán en GitHub. Render las guarda de forma segura.

### 2.5 ¡Iniciar el Despliegue!
Haz clic en el botón **Create Web Service** (Crear Servicio Web).

🎉 **¡Felicidades! Render empezará a trabajar.** Verás una pantalla de LOGS EN VIVO donde pasa esto:

1. **Clona tu repositorio GitHub** → Descarga tu código
2. **Ejecuta el Build Command**: `./mvnw clean package -DskipTests` → COMPILA (tarda ~3-5 minutos, tómate un café ☕)
3. **Ejecuta el Start Command**: `java -jar target/*.jar` → ENCIENDE LA APLICACIÓN
4. ✅ **Success!** = Tu app está en vivo 🥳

---

## 🧪 PASO 3: Probar que todo funciona

### 3.1 Encontrar tu URL pública
En la parte superior del Dashboard Render verás la URL de tu app:
```
https://urban-steps.onrender.com
```
(Será el nombre que elegiste + `.onrender.com`)

### 3.2 Smoke Test (Prueba rápida obligatoria)
Abre tu URL y prueba esto **EN ORDEN** (como si fueras un cliente):

1. **Página principal** → `/index.html`:
   ✅ Se cargan las imágenes, se ven los 8 productos demo, badges de descuento y destacados.

2. **Login Admin** (botón Login arriba derecha):
   ✅ Usa: `admin@urbansteps.com` / `admin123`
   ✅ Te muestra el avatar "AD" naranja y el botón "Panel Admin" funciona.
   ✅ El botón "Agregar Producto" (Modal) se abre y permite crear zapatos nuevos.

3. **Agregar al Carrito** (botón "Comprar" en cualquier zapato):
   ✅ Pide login si no estás logueado.
   ✅ Inicia sesión con `cliente@urbansteps.com` / `cliente123`
   ✅ Agrega 1 zapato → muestra toast verde "Agregado al carrito".

4. **Checkout** (carrito.html → "Ir a Pagar"):
   ✅ El Stepper de 2 pasos se ve bien.
   ✅ Los cupones funcionan: prueba `BIENVENIDO10` (10% OFF)
   ✅ Clic en "Pagar" → Se muestra la pantalla de éxito y se crea el pedido.

5. **Mis Pedidos** (perfil.html → "Ver Mis Pedidos"):
   ✅ Se ve el pedido que acabas de crear.
   ✅ El botón "Cancelar Pedido" funciona (revierte el stock automáticamente).

6. **Panel Admin (solo admin)** (pedidos.html):
   ✅ Se ve la gráfica de ventas, los filtros y la lista de TODOS los pedidos.
   ✅ El botón "Exportar PDF" descarga un PDF con logo naranja Urban Steps.

---

## 🐛 PASO 4: Errores comunes y cómo SOLUCIONARLOS (Troubleshooting)

Si algo falla, NO te frustres. ¡Le pasa a TODOS! Aquí los más típicos:

### ❌ Error 1: El Build Falla (maven no compila)
**Síntoma**: En los logs de Render, ves un error rojo y dice "Build failed"
**Causas y soluciones**:
- 📌 Faltó poner `-DskipTests` en el Build Command:
  ✅ `./mvnw clean package -DskipTests` (sin esto, los tests unitarios pueden fallar por BD inexistente)
- 📌 Problemas de memoria en la capa gratuita:
  En Build Command, agrega parámetros para reducir consumo RAM:
  ```
  ./mvnw clean package -DskipTests -Dmaven.compiler.fork=false
  ```

### ❌ Error 2: App arranca pero "Connection to BD failed"
**Síntoma**: El build pasa, pero el Start falla. En logs ves algo como:
`Communications link failure ... Unable to connect to database`
**Soluciones**:
1. Copia y pega **nuevamente** las 4 variables de BD:
   - `SPRING_DATASOURCE_URL` → Verifica que empiece con `jdbc:mysql://` y tenga `?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true` al final.
   - `SPRING_DATASOURCE_USERNAME` → ¡Es el usuario Clever Cloud, NO el tuyo de GitHub!
   - `SPRING_DATASOURCE_PASSWORD` → ¡La contraseña de Clever Cloud, sin espacios!
2. Espera 2 minutos. A veces Clever Cloud tarda en estar listo.

### ❌ Error 3: "Port error" o "Failed to bind to PORT"
**Síntoma**: Logs dicen algo como `Web service failed to bind to $PORT`
**Solución**: No te preocupes, Render lo arregla solo a veces. Pero si persiste:
- Asegúrate que en `application.properties` (ya lo hice!) esté:
  `server.port=${SERVER_PORT:${PORT:8080}}`
  Esto dice: "usa la variable PORT de Render, si no existe usa SERVER_PORT, y si nada 8080".

### ❌ Error 4: Cargo la URL y se ve "Bad Gateway 502" o "Not ready"
**Síntoma**: Página blanca con error 502.
**Explicación normal**: Render tarda ~3-5 minutos en terminar todo.
**Qué hacer**:
1. Espera 5 minutos y recarga (F5).
2. Si sigue, mira los **Live Logs** en Render (panel izquierdo → Logs) y busca la palabra **ERROR** en rojo.
3. Reinicia manualmente: Botón **Manual Deploy** → **Deploy latest commit**.

### ❌ Error 5: CORS (No puedo iniciar sesión / Las peticiones no funcionan)
**Síntoma**: La página carga pero no puedo hacer login, o veo errores `CORS policy` en Consola del navegador (F12).
**Causa**: Tu `SecurityConfig` limita los dominios permitidos.
**Soluciones**:
- Asegúrate de haber incluido `AllowedOriginPatterns` (ya lo hice!):
  Render: `*.onrender.com`, `onrender.com` → ya está en la lista de CORS.
- NUNCA uses `allowedOrigins("*")` con `allowCredentials(true)` (son incompatibles por estándar W3C).

---

## 💡 PARTE 3: COSAS EXTRA (Cuando quieras profesionalizar más)

### Extra A: Poner tu propio Dominio (ej: www.urbansteps.com)
1. Compra un dominio en Namecheap, GoDaddy, Mercado Libre Dominios, etc.
2. En Render → Settings → Custom Domains → **Add Custom Domain**:
   ```
   Dominio: www.urbansteps.com
   ```
3. Render te dará un **CNAME Record**:
   ```
   Nombre: www
   Valor: urban-steps.onrender.com
   ```
4. Ve a tu proveedor de dominios y configura:
   - **Tipo**: CNAME
   - **Host**: `www` (o `@` para dominio raíz)
   - **Apunta a**: (el valor que Render te dio)
5. Espera 5 minutos a 24 horas (propagación DNS).
6. ✅ Render agrega HTTPS (SSL) **GRATIS** automáticamente con Let's Encrypt. ¡Tu tienda será segura!

### Extra B: Escalar cuando tu tienda crezca
Si empiezas a tener muchas ventas:
- **Upgrade Plan Render**: De Free a **Starter ($7/mes)** → más RAM, menos apagados en modo inactivo.
- **Escalar Horizontalmente**: En Render Settings puedes agregar más "instancias" (réplicas de tu app).

---

## 🎓 RESUMEN DE LO QUE APRENDISTE HOY

¡Mira todo lo que ya sabes hacer! 🌟

1. ✅ Sabes diferenciar Frontend, Backend y Base de Datos.
2. ✅ Entiendes qué es un JAR, una Variable de Entorno y un Puerto.
3. ✅ Sabes elegir entre PaaS y IaaS.
4. ✅ Creaste una BD MySQL managed en Clever Cloud.
5. ✅ Conectaste GitHub, Render y Clever Cloud en un solo pipeline.
6. ✅ Desplegaste una aplicación Spring Boot completa en HTTPS pública.
7. ✅ Sabes diagnosticar errores comunes de despliegue leyendo logs.
8. ✅ Ya puedes ponerle tu dominio propio y vender zapatos a TODO el mundo.

---

## 🆘 ¿Te atascaste?

1. Primero: **Lee los logs en Render** (panel izquierdo → Logs). ¡Casi siempre la solución está ahí!
2. Segundo: Revisa esta guía, ve al paso que te corresponda y compara con lo que hiciste.
3. Tercero: Prueba localmente primero: `.\mvnw.cmd spring-boot:run` → abre `http://localhost:8082` → si falla localmente, probablemente falle en Render también.

---

## 🎉 ¡FELICIDADES!

Ya eres todo un **Full Stack Developer con conocimientos de Cloud Deployment**. 🥳

Ahora tu e-commerce **Urban Steps** está disponible las 24 horas del día, los 365 días del año, para que cualquier persona del mundo entre y compre tus zapatos. ¡Mucho éxito en tu emprendimiento!

---

## 📋 Archivos helper que creamos para ti:

| Archivo | ¿Para qué? |
|---------|-------------|
| [system.properties](file:///c:/Users/ASUS/Desktop/urban-steps-api/system.properties) | Le dice a Render que use **Java 17** (REQUERIDO). |
| [application-prod.properties](file:///c:/Users/ASUS/Desktop/urban-steps-api/src/main/resources/application-prod.properties) | Perfil de PRODUCCIÓN (más seguro: ddl-auto=validate, sin logs SQL). |
| [vercel.json](file:///c:/Users/ASUS/Desktop/urban-steps-api/vercel.json) | Opcional: por si algún día quieres servir SOLO el frontend en Vercel (separado del backend). |
