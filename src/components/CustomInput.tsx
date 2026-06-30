import { TextInput, StyleSheet, TextInputProps, Text, View } from 'react-native';
import { Controller } from 'react-hook-form'
type CustomInputProps = {
    control: any;
    name: string
} & TextInputProps;  //merges with text input props

export default function CustomInput({ control, name, ...props }: CustomInputProps) {
    return (<Controller
        name={name}
        control={control}
        rules={{ required: 'This field is required' }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <View style={styles.container}>
                <TextInput
                    {...props}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    style={[styles.input, props.style]}

                />
                <Text style={styles.error}>{error?.message}</Text>
            </View>
        )} />

    ); //so that we can allow overwriting of props as well
}

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        borderColor: '#ccc',
        width: '80%',
    }, error: {
        color: 'crimson'
    }, container: {
        gap: 2
    }
});