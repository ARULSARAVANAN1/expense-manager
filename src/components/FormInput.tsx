interface FormInputProps {
    label: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
}


function FormInput({
    label,
    type,
    value,
    onChange,
}: FormInputProps) {
    return (
        <div>
            <label>{label}</label>

            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

export default FormInput;