# Just Steps

App de contador de pasos hecha con React Native (Expo). Android es la plataforma principal; iOS es compatible a través de HealthKit.

Toda la información (perfil, meta diaria y caché de pasos) se guarda **solo en el dispositivo**. No hay conexión con ninguna API ni base de datos externa; la única conexión de red es con los servidores de EAS Update (Expo) para descargar actualizaciones de la app (ver más abajo).

## Funcionalidad (v1)

- **Onboarding** (solo la primera vez): creación de perfil con nombre, fecha de nacimiento, altura y peso. A partir de esos datos se sugiere una meta diaria de pasos (heurística por edad e IMC); siempre se puede elegir entre 6.000 / 8.000 / 10.000 pasos o una cantidad personalizada.
- **Home**: donut con los pasos del día, la meta y el estado "Goal reached". Debajo del donut se muestra el promedio de pasos de los últimos 7 días. La barra superior incluye el círculo de perfil y el selector D/W/M (por ahora visual, sin funcionalidad).
- **Gráfico semanal**: barras de los últimos 7 días con la meta; al tocar un día, el donut muestra ese día (solo "Today" es en vivo).
- **Actualizaciones en la app**: banner "A new version is available" cuando hay una versión nueva en EAS Update; al tocar "Update now" la app descarga y recarga sola.

Fuera de scope por ahora: pills de streak/kcal/km/min/insights, sección PRO y botones del footer.

## Actualizaciones OTA (EAS Update)

La app usa [`expo-updates`](https://docs.expo.dev/versions/latest/sdk/updates/) con EAS Update para distribuir cambios de JavaScript/assets sin generar un APK nuevo ni pasar por ninguna tienda.

- **Canales**: el perfil `preview` de `eas.json` escucha el canal `preview` (APK interno) y `production` el canal `production`.
- **Publicar un update**: `yarn ota --message "Descripción del cambio"`. Solo aplica a builds con el mismo `runtimeVersion` (política `appVersion`, derivada de `version` en `app.json`).
- **Cambios nativos** (subir SDK, añadir módulos nativos, cambiar config plugins): subir `version` en `app.json` y generar APK nuevo con `yarn apk`; el usuario debe reinstalar, el banner no puede aplicarlos.
- **Limitación**: la API de updates solo funciona en builds de release; en Expo Go o development client el banner no aparece.
- El check automático en el arranque está desactivado (`checkAutomatically: "ON_ERROR_RECOVERY"`); quien comprueba es el `UpdateBanner` al montar.

## Cómo se cuentan los pasos

- **Android**: [Health Connect](https://developer.android.com/health-and-fitness/health-connect) vía `react-native-health-connect`. Requiere que la app Health Connect esté instalada/en el sistema (Android 14+ la incluye en el framework). El conteo funciona aunque la app esté cerrada.
- **iOS**: HealthKit vía `@kingstinct/react-native-healthkit`.

## Requisitos

- Node.js 20.19+ o 22.13+ (la 24.x también sirve).
- **No funciona en Expo Go**: al usar módulos nativos de salud hace falta un *development build*.

## Arranque

```bash
npm install

# Android (necesita un emulador con Health Connect o un dispositivo físico)
npx expo prebuild
npx expo run:android

# iOS (solo en macOS con Xcode)
npx expo run:ios
```

Si `run:android` falla con errores de SDK, instala la plataforma correspondiente con Android Studio (SDK 36, minSdk 26).

## Probar el conteo en emulador

Health Connect del emulador no registra pasos "caminados", pero se pueden insertar datos de prueba con `adb`:

```bash
# Interfaz de Health Connect del emulador (permite añadir pasos manualmente)
adb shell am start -a android.health.connect.action.MANAGE_HEALTH_DATA
```

## Resetear el perfil

No hay opción de "cerrar sesión" en la app (fuera de scope de la v1). Para volver a ver el onboarding, borra los datos de la app desde Ajustes del sistema (o reinstala la app).

## Estructura

```
src/
  app/            # Rutas (expo-router): _layout, index (gate), onboarding, home
  components/     # DonutChart, WeekChart, UpdateBanner, ProfileBadge, SegmentedControl, GoalPicker
  hooks/          # useTodaySteps, useWeekSteps
  services/       # goalEstimator, steps/ (fachada por plataforma: Health Connect / HealthKit)
  storage/        # profileStorage, stepsHistoryStorage (AsyncStorage)
  theme.ts        # Colores y espaciado
```
