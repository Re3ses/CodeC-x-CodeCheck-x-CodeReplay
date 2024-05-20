export default function BorderedContainer(props) {
    return (
        <div className={`rounded-md border border-zinc-800 ${props.customStyle}`}>
            {props.children}
        </div>
    )
}

