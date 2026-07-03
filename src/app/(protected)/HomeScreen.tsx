import { View, Text, Button } from 'react-native'
import React from 'react'
import { useAuth } from '@clerk/clerk-expo'

const HomeScreen = () => {
    const { signOut } = useAuth();

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 24 }}>HomeScreen</Text>

            <Text style={{ fontSize: 16 }}>Only Logged In users can see this</Text>
            <Button title='Sign Out' onPress={() => signOut()} />
        </View>
    )
}

export default HomeScreen