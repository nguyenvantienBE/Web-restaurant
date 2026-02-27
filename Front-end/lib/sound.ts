"use client";

import { useEffect, useRef } from "react";

// Sound URLs (free beep tones via data URIs for demo)
const SOUNDS = {
    newOrder: "https://www.soundjay.com/buttons/sounds/beep-07.mp3",
    kitchenTicket: "https://www.soundjay.com/buttons/sounds/beep-09.mp3",
    itemReady: "https://www.soundjay.com/buttons/sounds/beep-08.mp3",
    staffCall: "https://www.soundjay.com/buttons/sounds/beep-10.mp3",
};

let soundEnabled = true;

export function setSoundEnabled(val: boolean) {
    soundEnabled = val;
}

export function getSoundEnabled() {
    return soundEnabled;
}

export async function playSound(type: keyof typeof SOUNDS) {
    if (!soundEnabled) return;
    try {
        const audio = new Audio(SOUNDS[type]);
        audio.volume = 0.5;
        await audio.play();
    } catch {
        // Ignore autoplay restrictions
    }
}
