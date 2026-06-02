/** Haptic feedback utility for PWA */

export function hapticLight() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(10);
    }
}

export function hapticMedium() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(25);
    }
}

export function hapticSuccess() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([10, 50, 20]);
    }
}

export function hapticCelebration() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([10, 30, 10, 30, 20, 50, 30]);
    }
}
