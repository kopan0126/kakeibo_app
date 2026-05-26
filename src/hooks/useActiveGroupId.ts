import { useViewStore } from '../stores/viewStore';

type Filter = {
  showPersonal: boolean;
  groupId: string | null;
};

export function useTransactionFilter(): Filter {
  const { selectedScope } = useViewStore();
  return {
    showPersonal: selectedScope === 'personal',
    groupId: selectedScope !== 'personal' ? selectedScope : null,
  };
}
