import { View, Text } from 'react-native'
import React from 'react'

const HomeScreen = () => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 24 }}>HomeScreen</Text>

            <Text style={{ fontSize: 16 }}>Only Logged In users can see this</Text>
        </View>
    )
}

export default HomeScreen