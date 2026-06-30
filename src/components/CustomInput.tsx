import { TextInput, StyleSheet, TextInputProps } from 'react-native';

type CustomInputProps = {
    // custom fields
} & TextInputProps;  //merges with text input props

export default function CustomInput(props: CustomInputProps) {
    return <TextInput {...props} style={[styles.input, props.style]} />; //so that we can allow overwriting of props as well
}

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        borderColor: '#ccc',
        width: '80%',
    },
});