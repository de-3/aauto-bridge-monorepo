'use client'

import { useState } from "react"

export default function Settings(props:any){
    const handleMaxChargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.setMaxCharge(e.target.value)
    };

    const handleChargeThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.setChargeThreshold(e.target.value)
    };
    return (
        <>
            <label>network</label>
            <label>max value</label>
            <input type="number" max={1} min={0} value={props.maxCharge} onChange={handleMaxChargeChange} />
            <label>chargeThreshold</label>
            <input type="number" max={1} min={0} value={props.chargeThreshold} onChange={handleChargeThresholdChange} />
            <button onClick={props.handlAddClick}>add</button>
        </>
    )
}