"use client"

import { SunIcon, MoonIcon } from "lucide-react"
import { useTheme } from "next-themes"


export const ThemeSwitch = () => {
    const { theme, setTheme } = useTheme()

    return theme === "dark" ? (
        <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted"

            onClick={() => { setTheme("light") }}

        >
            <SunIcon />

        </button>
    ) : (

        <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted"

            onClick={() => { setTheme("dark") }}

        >
            <MoonIcon />

        </button>
    )
}