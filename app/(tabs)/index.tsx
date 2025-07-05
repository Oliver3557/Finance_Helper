import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';

function formatCurrency(value: string | number) {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(number)) return '';
  return number.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

function formatNumberInput(text: string) {
  // Allow digits and max two decimals, no negatives
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts[1]; // Prevent multiple decimals
  if (parts[1]?.length > 2) {
    return parts[0] + '.' + parts[1].slice(0, 2);
  }
  return cleaned;
}

export default function FinanceScreen() {
  const [sheetName, setSheetName] = useState('');
  const [selectedSheet, setSelectedSheet] = useState('');
  const [goal, setGoal] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  // Each income/outgoing is now an object { label: string, amount: string }
  const [incomes, setIncomes] = useState([{ label: '', amount: '' }]);
  const [outgoings, setOutgoings] = useState([{ label: '', amount: '' }]);
  const [savedSheets, setSavedSheets] = useState<{ [key: string]: any }>({});

  // Load savedSheets from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('savedSheets');
    if (stored) {
      setSavedSheets(JSON.parse(stored));
    }
  }, []);

  // Add income or outgoing row if last amount is filled
  const addIncome = () => {
    if (!incomes[incomes.length - 1].amount) {
      Alert.alert('Please enter an amount before adding another.');
      return;
    }
    setIncomes([...incomes, { label: '', amount: '' }]);
  };

  const addOutgoing = () => {
    if (!outgoings[outgoings.length - 1].amount) {
      Alert.alert('Please enter an amount before adding another.');
      return;
    }
    setOutgoings([...outgoings, { label: '', amount: '' }]);
  };

  // Delete income/outgoing row by index
  const deleteIncome = (index: number) => {
    setIncomes(incomes.filter((_, i) => i !== index));
  };
  const deleteOutgoing = (index: number) => {
    setOutgoings(outgoings.filter((_, i) => i !== index));
  };

  // Update label or amount for income/outgoing
  const updateIncomeLabel = (text: string, index: number) => {
    const newIncomes = [...incomes];
    newIncomes[index].label = text;
    setIncomes(newIncomes);
  };
  const updateIncomeAmount = (text: string, index: number) => {
    const formatted = formatNumberInput(text);
    const newIncomes = [...incomes];
    newIncomes[index].amount = formatted;
    setIncomes(newIncomes);
  };

  const updateOutgoingLabel = (text: string, index: number) => {
    const newOutgoings = [...outgoings];
    newOutgoings[index].label = text;
    setOutgoings(newOutgoings);
  };
  const updateOutgoingAmount = (text: string, index: number) => {
    const formatted = formatNumberInput(text);
    const newOutgoings = [...outgoings];
    newOutgoings[index].amount = formatted;
    setOutgoings(newOutgoings);
  };

  // Reset all inputs to default
  const resetAll = () => {
    setSheetName('');
    setSelectedSheet('');
    setGoal('');
    setCurrentBalance('');
    setIncomes([{ label: '', amount: '' }]);
    setOutgoings([{ label: '', amount: '' }]);
  };

  // Save current sheet logic with localStorage persistence
  const saveSheet = () => {
    if (!sheetName.trim()) {
      Alert.alert('Please enter a sheet name to save.');
      return;
    }

    const updatedSheets = {
      ...savedSheets,
      [sheetName]: {
        goal,
        currentBalance,
        incomes,
        outgoings,
      },
    };

    setSavedSheets(updatedSheets);
    localStorage.setItem('savedSheets', JSON.stringify(updatedSheets));  // Save to localStorage
    setSelectedSheet(sheetName);
    Alert.alert('Sheet saved!');
  };

  // Load saved sheet
  const loadSheet = (name: string) => {
    if (name === '') {
      resetAll();
      return;
    }
    const sheet = savedSheets[name];
    if (sheet) {
      setSheetName(name);
      setGoal(sheet.goal);
      setCurrentBalance(sheet.currentBalance);
      setIncomes(sheet.incomes);
      setOutgoings(sheet.outgoings);
      setSelectedSheet(name);
    }
  };

  // Calculate totals and difference
  const totalIncome = incomes.reduce(
    (sum, val) => sum + (parseFloat(val.amount) || 0),
    0
  );
  const totalOutgoings = outgoings.reduce(
    (sum, val) => sum + (parseFloat(val.amount) || 0),
    0
  );
  const difference = totalIncome - totalOutgoings;

  // Calculate amounts for goal
  const numericGoal = parseFloat(goal) || 0;
  const numericCurrentBalance = parseFloat(currentBalance) || 0;
  const needed = numericGoal > numericCurrentBalance ? numericGoal - numericCurrentBalance : 0;

  // Months to reach goal
  const months = difference > 0 ? Math.ceil(needed / difference) : '∞';

  // Conditional messages
  const reachedGoal = numericGoal && numericCurrentBalance >= numericGoal;

  return (
    <LinearGradient colors={['#e0eafc', '#cfdef3']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Sheet Selector */}
        <Text style={styles.title}>Saving Goal Calculator</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedSheet}
            onValueChange={loadSheet}
            style={styles.picker}
            dropdownIconColor="#007bff"
          >
            <Picker.Item label="-- Select a sheet --" value="" />
            {Object.keys(savedSheets).map((name) => (
              <Picker.Item key={name} label={name} value={name} />
            ))}
          </Picker>
        </View>

        {/* Section Title: Sheet Details */}
        <Text style={styles.sectionTitle}>Sheet Details</Text>

        {/* Sheet Name Input */}
        <TextInput
          placeholder="Sheet Name"
          value={sheetName}
          onChangeText={setSheetName}
          style={styles.inputBox}
        />

        {/* Section Title: Goal & Balance */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Goal & Balance</Text>

        {/* Goal & Current Balance */}
        <View style={styles.goalRow}>
          <TextInput
            placeholder="Saving Goal"
            keyboardType="numeric"
            value={goal}
            onChangeText={(t) => setGoal(formatNumberInput(t))}
            style={[styles.inputBox, styles.flex1, { marginRight: 10 }]}
          />
          <TextInput
            placeholder="Current Balance"
            keyboardType="numeric"
            value={currentBalance}
            onChangeText={(t) => setCurrentBalance(formatNumberInput(t))}
            style={[styles.inputBox, styles.flex1]}
          />
        </View>

        {/* Income and Outgoings columns */}
        <View style={styles.columnsRow}>
          {/* Income */}
          <View style={styles.column}>
            <Text style={styles.title}>Income</Text>
            {incomes.map(({ label, amount }, i) => (
              <View key={i} style={styles.row}>
                <TextInput
                  placeholder="Label (optional)"
                  value={label}
                  onChangeText={(text) => updateIncomeLabel(text, i)}
                  style={[styles.inputBox, styles.labelInput]}
                />
                <TextInput
                  placeholder="Amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(text) => updateIncomeAmount(text, i)}
                  style={[styles.inputBox, styles.amountInput]}
                />
                {incomes.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteIncome(i)}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addIncome}>
              <Text style={styles.addText}>＋</Text>
            </TouchableOpacity>
          </View>

          {/* Outgoings */}
          <View style={styles.column}>
            <Text style={styles.title}>Outgoings</Text>
            {outgoings.map(({ label, amount }, i) => (
              <View key={i} style={styles.row}>
                <TextInput
                  placeholder="Label (optional)"
                  value={label}
                  onChangeText={(text) => updateOutgoingLabel(text, i)}
                  style={[styles.inputBox, styles.labelInput]}
                />
                <TextInput
                  placeholder="Amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(text) => updateOutgoingAmount(text, i)}
                  style={[styles.inputBox, styles.amountInput]}
                />
                {outgoings.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteOutgoing(i)}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addOutgoing}>
              <Text style={styles.addText}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsRow}>
          <Text style={styles.totalsText}>
            Total Income: {formatCurrency(totalIncome)}
          </Text>
          <Text style={styles.totalsText}>
            Total Outgoings: {formatCurrency(totalOutgoings)}
          </Text>
          <Text style={styles.totalsText}>
            Difference: {formatCurrency(difference)}
          </Text>
        </View>

        {/* Goal Calculation */}
        <View style={styles.goalInfo}>
          {reachedGoal ? (
            <Text style={styles.goalReached}>
              🎉 You have reached your saving goal!
            </Text>
          ) : (
            <>
              <Text style={styles.goalRemaining}>
                You need {formatCurrency(needed)} more to reach your goal.
              </Text>
              <Text style={styles.goalRemaining}>
                At your current difference, it will take {months} month
                {months === 1 ? '' : 's'} to reach your goal.
              </Text>
            </>
          )}
        </View>

        {/* Save and Reset Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.saveButton} onPress={saveSheet}>
            <Text style={styles.saveText}>Save Sheet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={resetAll}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    padding: 15,
    paddingBottom: 60,
    backgroundColor: '#f5f9ff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    color: '#333',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 5,
    marginBottom: 20,
    overflow: Platform.OS === 'android' ? 'hidden' : undefined,
  },
  picker: {
    height: 50,
    color: '#007bff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#222',
  },
  inputBox: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
  columnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginRight: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelInput: {
    flex: 2,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
  },
  deleteButton: {
    marginLeft: 5,
    backgroundColor: '#ff4d4f',
    borderRadius: 20,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 18,
  },
  addButton: {
    backgroundColor: '#007bff',
    borderRadius: 6,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '700',
  },
  totalsRow: {
    marginTop: 20,
    marginBottom: 10,
  },
  totalsText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
    color: '#444',
  },
  goalInfo: {
    marginBottom: 20,
  },
  goalReached: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2ecc71',
  },
  goalRemaining: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
  },
  resetText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
