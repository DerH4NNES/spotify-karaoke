import {useProviderContext} from "../providers/ProviderContext";
import React from "react";

export function Auth() {

    const {ready, authChecked, setReady, setAuthChecked, setPlayerClient, provider} = useProviderContext()

    const handleLogout = () => {
        try {
            if (provider && typeof provider.logout === 'function') provider.logout()
            else console.warn('No provider logout() available')
        } catch (e) {
            console.warn('logout failed', e)
        }
        // update hook state
        if (setReady) setReady(false)
        if (setAuthChecked) setAuthChecked(true)
        if (setPlayerClient) setPlayerClient(null)
    }

    return(
        <div className="ms-auto d-flex gap-2">
        {ready && authChecked && (
            <button className="btn btn-outline-secondary" onClick={handleLogout}>
                Logout
            </button>
        )}
    </div>);
}