export default function Connect(props:any) {
    const handleConnecting = () => {
        if (props.isConnecring){
            props.setFirstSettingStatus(1)
        }else{
            props.setIsConnecting(!props.isConnecring)
        }
    }
    return (
        <div>
            <h2>Masterhack</h2>
            <button onClick={handleConnecting} >{props.isConnecring ? "🔄" : "connect"} </button>
        </div>
    )
  }
  