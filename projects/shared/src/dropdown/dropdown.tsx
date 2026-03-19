import React from "react";

interface Option {
    id: string;
    name: string;
}

interface DropdownMenuProps {
    options: Option[];
    activeOption: Option;
    switchCallback: (option: Option) => void;
}

const DropdownMenu = ({ options, activeOption, switchCallback }: DropdownMenuProps) => {
    return (
        <label className="stats-native-select-wrapper">
            <span className="stats-native-select-label">Range</span>
            <select
                className="stats-native-select"
                aria-label="Select option"
                value={activeOption.id}
                onChange={(event) => {
                    const option = options.find((item) => item.id === event.target.value);
                    if (option) switchCallback(option);
                }}
            >
                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.name}
                    </option>
                ))}
            </select>
        </label>
    );
};

export default DropdownMenu;
