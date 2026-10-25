import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useResponsive } from "@/hooks/use-responsive";
import { StyleSheet } from "react-native";

export default function MasterDetail() {
  const { isTablet } = useResponsive();

  return (
    <ThemedView style={[styles.container, isTablet && styles.row]}>
      <ThemedView style={[styles.master, isTablet && styles.masterTablet]}>
        <ThemedText>Master</ThemedText>
      </ThemedView>
      <ThemedView style={[styles.detail, !isTablet && styles.detailPhone]}>
        <ThemedText style={styles.detailText}>
          Detail content goes here. On phones, this stacks below the master
          view. On tablets, it appears to the right of the master view.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: "row" },
  master: { flex: 1, padding: 12 },
  masterTablet: { maxWidth: 360, borderRightWidth: 1, borderColor: "#ddd" },
  item: { paddingVertical: 16, paddingHorizontal: 12, borderRadius: 8 },
  selected: { backgroundColor: "#eef" },
  itemText: { fontSize: 16 },
  detail: { flex: 2, padding: 16, justifyContent: "center" },
  detailPhone: { flex: 1 }, // stacks below on phones
  detailText: { fontSize: 18 },
});
