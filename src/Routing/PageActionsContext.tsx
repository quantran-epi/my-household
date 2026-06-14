import React from "react";

export type PageAction = {
    key: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
};

type PageActionsContextValue = {
    actions: PageAction[];
    setActions: (actions: PageAction[]) => void;
};

const PageActionsContext = React.createContext<PageActionsContextValue | null>(null);

export const PageActionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [actions, setActions] = React.useState<PageAction[]>([]);
    const value = React.useMemo(() => ({ actions, setActions }), [actions]);
    return <PageActionsContext.Provider value={value}>{children}</PageActionsContext.Provider>;
};

export const usePageActionsState = (): PageAction[] => {
    const ctx = React.useContext(PageActionsContext);
    return ctx?.actions ?? [];
};

/**
 * Register this page's global actions into the app header ⋮ menu.
 * Mirrors useScreenTitle: registers on mount / when deps change, clears on unmount.
 */
export const usePageActions = (items: PageAction[], deps: React.DependencyList): void => {
    const ctx = React.useContext(PageActionsContext);
    const setActions = ctx?.setActions;
    React.useEffect(() => {
        if (!setActions) return;
        setActions(items);
        return () => setActions([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
};
