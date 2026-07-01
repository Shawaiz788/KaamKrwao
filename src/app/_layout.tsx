import { AuthProvider } from "@/providers/AuthProvider";
import { Slot } from "expo-router";


export default function RootLayout() {
    console.log('Root Layout')
    return (
        <AuthProvider>
            <Slot />
        </AuthProvider>
    )
}