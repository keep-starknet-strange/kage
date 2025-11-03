import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import { EdgeInsets, useSafeAreaInsets, SafeAreaProvider } from "react-native-safe-area-context";

interface DynamicSafeAreaContext {
    additionalInsets: EdgeInsets;

    setAdditionalInsets: (insets: EdgeInsets) => void;
}

const DynamicSafeAreaContext = createContext<DynamicSafeAreaContext>({
    additionalInsets: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    setAdditionalInsets: (EdgeInsets) => { },
});

export const useDynamicSafeAreaInsets = () => {
    const { additionalInsets, setAdditionalInsets } = useContext(DynamicSafeAreaContext);
    const appInsets = useSafeAreaInsets();

    const insets = useMemo<EdgeInsets>(() => {
        return {
            top: appInsets.top + additionalInsets.top,
            right: appInsets.right + additionalInsets.right,
            bottom: appInsets.bottom + additionalInsets.bottom,
            left: appInsets.left + additionalInsets.left,
        };
    }, [
        appInsets.top, appInsets.right, appInsets.bottom, appInsets.left,
        additionalInsets.top, additionalInsets.right, additionalInsets.bottom, additionalInsets.left
    ]);

    return {
        insets,
        setAdditionalInsets,
    };
}

export const DynamicSafeAreaProvider = ({ children }: PropsWithChildren) => {
    const [additionalInsets, setAdditionalInsets] = useState<EdgeInsets>({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    });

    return (
        <SafeAreaProvider>
            <DynamicSafeAreaContext.Provider value={{ additionalInsets, setAdditionalInsets }}>
                {children}
            </DynamicSafeAreaContext.Provider>
        </SafeAreaProvider>
    );
}

