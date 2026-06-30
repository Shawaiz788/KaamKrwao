import { TextInput, StyleSheet, TextInputProps, Text, View } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form'
type CustomInputProps<T extends FieldValues> = {
    control: Control<T>;
    name: Path<T>
} & TextInputProps;  //merges with text input props

export default function CustomInput<T extends FieldValues>({ control, name, ...props }: CustomInputProps<T>) {
    return (<Controller
        name={name}
        control={control}
        // rules={{ required: 'This field is required' }} removed as we will now use schema validation from 
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
        width: '100%',
    }, error: {
        color: 'crimson'
    }, container: {
        width: '80%',
        gap: 2
    }
});