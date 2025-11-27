# 📄 Documentación Técnica de Despliegue: Proyecto React Native (Bleeding Edge)

> **Resumen Ejecutivo:** Guía de configuración para entorno de desarrollo Windows limpio, apuntando a especificaciones de última generación (Android 16/API 36 + React Native 0.82).

**Estado:** ✅ Despliegue Exitoso  
**Fecha:** 26 Noviembre 2025  
**Plataforma Host:** Windows 10/11 (x64)  
**Dispositivo Target:** Android Físico (Debug Mode)

---

## 1. Stack Tecnológico (Matriz de Compatibilidad)

Para la correcta compilación del proyecto, es **imperativo** respetar la alineación estricta entre Gradle 9, Java 21 y Android API 36. Cualquier desviación provoca fallos en la cadena de herramientas (*toolchain*).

| Componente | Versión Implementada | Notas Técnicas |
| :--- | :--- | :--- |
| **Node.js** | **22.11.0 (LTS)** | Motor de ejecución JS. Requerido `>=20`. |
| **Java JDK** | **Microsoft OpenJDK 21** | **CRÍTICO.** Gradle 9.0 requiere Java 21 para interpretar los plugins modernos. |
| **React Native**| **0.82.1** | Versión *Bleeding Edge*. Nueva arquitectura habilitada por defecto. |
| **Gradle** | **9.0.0** | Sistema de construcción. No permite *downgrade* (Android 36 requiere mín. Gradle 8.13+). |
| **Android API** | **Level 36 (Baklava)** | Preview Release. |
| **Build Tools** | **36.0.0** | Versión exacta requerida en `build.gradle`. |
| **NDK** | **27.1.12297006** | Side-by-side. Esencial para la compilación de Hermes y módulos nativos. |

---

## 2. Resolución de Conflictos (El "Hotfix" Crítico)

### El Problema
Al ejecutar `clean` o `build` en un entorno Windows limpio, Gradle 9.0 lanza la excepción:
> `Class org.gradle.jvm.toolchain.JvmVendorSpec does not have member field ... IBM_SEMERU`

**Diagnóstico:** Fallo en el mecanismo de auto-detección (*Auto-provisioning*) de Toolchains de Gradle 9 al interactuar con plugins de Kotlin/Android recientes en Windows. Gradle intenta descargar o buscar binarios corruptos en `.gradle/.tmp`.

### La Solución (Bypass de Toolchain)
Se debe forzar la ruta del JDK explícitamente en las propiedades del proyecto, anulando la auto-detección de Gradle.

**Archivo:** `android/gradle.properties`
**Configuración inyectada:**

```properties
# Ajustar ruta según instalación local del JDK 21
# NOTA: En Windows es mandatorio usar doble backslash (\\) como separador
org.gradle.java.home=C:\\Program Files\\Microsoft\\jdk-21.0.5.11-hotspot
```

---

## 3. Flujo de Funcionamiento (Architecture Workflow)

Diagrama de interacción de los componentes instalados:

```mermaid
graph TD
    subgraph "Host (PC Windows)"
        A[npm run android] -->|Inicia| B(Metro Bundler :8081)
        A -->|Invoca| C{Gradle 9.0 Wrapper}
        
        C -->|Usa (Forzado)| D[JDK 21]
        C -->|Compila con| E[Android SDK 36 + NDK 27]
        
        B -->|Sirve JS Bundle| F[Puente ADB]
        E -->|Genera APK| F
    end
    
    subgraph "Dispositivo Android"
        F -->|Instala APK| G[App Nativa]
        G -->|Solicita Bundle| F
        F -->|Transfiere JS| G
        G -->|Renderiza| H[UI Usuario]
    end
```

**Resumen del Ciclo de Vida (Runtime):**
1.  **Bootstrapping:** Node.js inicia el CLI de React Native.
2.  **Compilación Nativa:** Gradle 9 toma el código Kotlin/Java y lo compila usando las herramientas de **Android 36**. El uso de **Java 21** es vital aquí.
3.  **Instalación:** El APK generado se empuja al dispositivo vía **ADB**.
4.  **Bundling:** La App se conecta al puerto `8081` (Metro Bundler) para recibir el código JS compilado al vuelo.

---

## 4. Procedimiento de Reproducción (Receta Rápida)

Pasos exactos para configurar una nueva máquina de desarrollo:

1.  **Instalar Node 22** (LTS).
2.  **Instalar JDK 21** (Recomendado: Microsoft Build of OpenJDK).
3.  **Instalar Android Studio:**
    * Abrir *SDK Manager* -> Marcar "Show Package Details".
    * Instalar **API 36 (Baklava)**.
    * Instalar **Build-Tools 36.0.0**.
    * Instalar **NDK 27.1.12297006**.
    * Instalar **CMake 3.22.1**.
4.  **Configurar Variables de Entorno:**
    * `ANDROID_HOME`: Ruta al SDK.
    * `Path`: Agregar `%ANDROID_HOME%\platform-tools`.
5.  **Clonar Repositorio e Instalar Dependencias:**
    ```bash
    npm install
    ```
6.  **Aplicar el Parche de Gradle:**
    * Editar `android/gradle.properties`.
    * Agregar la línea `org.gradle.java.home` apuntando a tu JDK 21.
7.  **Limpiar y Ejecutar:**
    ```bash
    cd android && gradlew clean && cd ..
    npm run android
    ```

---

## 5. Troubleshooting / Lecciones Aprendidas

* **No hacer Downgrade de Gradle:** Android API 36 **requiere** Gradle 8.13 o superior. Dado que 8.13 no es público aún, se debe usar Gradle 9.0.0 obligatoriamente.
* **Limpieza:** Si Gradle falla a mitad de camino, siempre ejecutar `gradlew clean` dentro de la carpeta `android` antes de intentar de nuevo.
* **ADB:** Si el dispositivo aparece como `unauthorized`, revisar la pantalla del celular para aceptar la huella RSA de la PC.