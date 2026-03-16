<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use App\Models\PrinterSetup;
use Illuminate\Http\Request;

class PrinterSetupController extends Controller
{
    public function index()
    {
        $printerSetups = PrinterSetup::all();
        return view('webadmin.printer_setups.index', compact('printerSetups'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'operation_type' => 'required|string|unique:printer_setups',
            'printer_id' => 'nullable|string',
            'printer_model' => 'nullable|string',
            'order_kitchen' => 'boolean',
            'order_as_inputted' => 'boolean',
            'order_group' => 'boolean',
            'kitchen_duplicate' => 'boolean',
            'kitchen_triplicate' => 'boolean',
            'order_duplicate' => 'boolean',
            'group_duplicate' => 'boolean',
            'kitchen_printing_yes_no' => 'boolean',
            'order_print_through_printer_object' => 'boolean',
            'bill_print_through_printer_object' => 'boolean',
            'bill_printing_optional_at_billing' => 'boolean',
            'billing_type' => 'required|in:direct,group_based',
            'bill_duplicate' => 'boolean',
            'slip_report' => 'boolean',
            'label' => 'boolean',
            'printer_type_cols' => 'integer',
            'no_of_line_print' => 'integer',
        ]);

        PrinterSetup::create($this->prepareData($request));

        return redirect()->route('admin.printer-setups.index')->with('success', 'Printer setup created successfully.');
    }

    public function edit($id)
    {
        $printerSetup = PrinterSetup::findOrFail($id);
        $printerSetups = PrinterSetup::all();
        return view('webadmin.printer_setups.index', compact('printerSetup', 'printerSetups'));
    }

    public function update(Request $request, $id)
    {
        $printerSetup = PrinterSetup::findOrFail($id);
        
        $request->validate([
            'operation_type' => 'required|string|unique:printer_setups,operation_type,' . $id,
            'printer_id' => 'nullable|string',
            'printer_model' => 'nullable|string',
            'billing_type' => 'required|in:direct,group_based',
            'printer_type_cols' => 'integer',
            'no_of_line_print' => 'integer',
        ]);

        $printerSetup->update($this->prepareData($request));

        return redirect()->route('admin.printer-setups.index')->with('success', 'Printer setup updated successfully.');
    }

    public function destroy($id)
    {
        $printerSetup = PrinterSetup::findOrFail($id);
        $printerSetup->delete();

        return redirect()->route('admin.printer-setups.index')->with('success', 'Printer setup deleted successfully.');
    }

    private function prepareData(Request $request)
    {
        $data = $request->all();
        
        // Handle checkboxes (ensure boolean value)
        $checkboxes = [
            'order_kitchen', 'order_as_inputted', 'order_group', 
            'kitchen_duplicate', 'kitchen_triplicate', 'order_duplicate', 'group_duplicate',
            'kitchen_printing_yes_no', 'order_print_through_printer_object',
            'bill_print_through_printer_object', 'bill_printing_optional_at_billing',
            'bill_duplicate', 'slip_report', 'label'
        ];

        foreach ($checkboxes as $checkbox) {
            $data[$checkbox] = $request->has($checkbox);
        }

        return $data;
    }
}
