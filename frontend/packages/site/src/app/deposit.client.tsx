'use client'

export default function Deposit(props:any) {
    const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.setDeposit(e.target.value)
    }
    return (
        <div>
            <label>Deposit</label>
            <input type="number" min={0} value={props.deposit} onChange={handleDepositChange} />
        </div>
    )
}