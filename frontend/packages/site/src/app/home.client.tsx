'use client'

import { use, useState } from "react";
import Connect from "./connect";
import Setting from "./setting.client";

export default function ClientSideComponent() {
    const [isConnecring,setIsConnecting] = useState(false)
    const [firstSettingStatus,setFirstSettingStatus] = useState(0)
    return (
        <div>
            {
                firstSettingStatus === 0 ? (
                    <Connect isConnecring={isConnecring} setIsConnecting={setIsConnecting} setFirstSettingStatus={setFirstSettingStatus} />
                ) : (
                    firstSettingStatus === 4 ? (
                        <h2>メニュー</h2>
                    ):(
                        <Setting firstSettingStatus={firstSettingStatus} setFirstSettingStatus={setFirstSettingStatus} />
                    )
                )
            }
        </div>
    )
}