@extends('webadmin.layout.app')

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="h4"><i class="bi bi-printer me-2"></i> Printer Setup</h2>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item"><a href="{{ route('admin.dashboard') }}">Dashboard</a></li>
                <li class="breadcrumb-item">Orders</li>
                <li class="breadcrumb-item active">Printer Setup</li>
            </ol>
        </nav>
    </div>

    @if(isset($printerSetup))
        <div class="alert alert-info shadow-sm mb-4">
            <i class="bi bi-info-circle me-2"></i> You are currently editing <strong>{{ $printerSetup->operation_type }}</strong> setup. 
            <a href="{{ route('admin.printer-setups.index') }}" class="btn btn-sm btn-link">Cancel and Add New</a>
        </div>
    @endif

    <div class="row">
        <!-- Printer List Table -->
        <div class="col-12 mb-4">
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white border-bottom py-3">
                    <h5 class="card-title mb-0">Existing Printer Setups</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light">
                                <tr>
                                    <th class="ps-4">Operation Type</th>
                                    <th>Printer ID</th>
                                    <th>Printer Model</th>
                                    <th class="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($printerSetups as $setup)
                                <tr>
                                    <td class="ps-4 fw-bold">
                                        <span class="text-{{ (isset($printerSetup) && $printerSetup->id == $setup->id) ? 'primary' : 'dark' }}">
                                            {{ $setup->operation_type }}
                                        </span>
                                    </td>
                                    <td><code>{{ $setup->printer_id }}</code></td>
                                    <td>{{ $setup->printer_model }}</td>
                                    <td class="text-center">
                                        <div class="btn-group">
                                            <a href="{{ route('admin.printer-setups.edit', $setup->id) }}" class="btn btn-sm btn-outline-primary"><i class="bi bi-pencil"></i></a>
                                            <form action="{{ route('admin.printer-setups.destroy', $setup->id) }}" method="POST" class="d-inline" onsubmit="return confirm('Delete this printer setup?')">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                                @empty
                                <tr>
                                    <td colspan="4" class="text-center py-4 text-muted">No printer setups configured.</td>
                                </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Configuration Form -->
        <div class="col-12">
            <form action="{{ isset($printerSetup) ? route('admin.printer-setups.update', $printerSetup->id) : route('admin.printer-setups.store') }}" method="POST">
                @csrf
                @if(isset($printerSetup))
                    @method('PUT')
                @endif

                <div class="card shadow-sm border-0">
                    <div class="card-header bg-white border-bottom py-3">
                        <h5 class="card-title mb-0">{{ isset($printerSetup) ? 'Edit Printer Setup' : 'Add New Printer Setup' }}</h5>
                    </div>
                    <div class="card-body">
                        <!-- Top Input Row -->
                        <div class="row g-3 mb-4">
                            <div class="col-md-4">
                                <label class="form-label fw-bold">Operation Type</label>
                                <input type="text" name="operation_type" class="form-control" value="{{ old('operation_type', $printerSetup->operation_type ?? '') }}" placeholder="e.g. PIZZA, BAR" required>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-bold">Printer ID</label>
                                <input type="text" name="printer_id" class="form-control" value="{{ old('printer_id', $printerSetup->printer_id ?? '') }}" placeholder="e.g. PIZZA2, winspool, Ne11:">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-bold">Printer Model</label>
                                <input type="text" name="printer_model" class="form-control" value="{{ old('printer_model', $printerSetup->printer_model ?? '') }}" placeholder="e.g. Epson TM-T88II">
                            </div>
                        </div>

                        <div class="row g-4">
                            <!-- Order Section -->
                            <div class="col-lg-8">
                                <div class="p-3 border rounded bg-light-subtle h-100">
                                    <h6 class="fw-bold text-danger border-bottom pb-2 mb-3">Order</h6>
                                    <div class="row">
                                        <div class="col-md-7">
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" name="order_kitchen" id="order_kitchen" {{ old('order_kitchen', $printerSetup->order_kitchen ?? false) ? 'checked' : '' }}>
                                                <label class="form-check-label" for="order_kitchen">Kitchen (Order splited into kitchens)</label>
                                            </div>
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" name="order_as_inputted" id="order_as_inputted" {{ old('order_as_inputted', $printerSetup->order_as_inputted ?? false) ? 'checked' : '' }}>
                                                <label class="form-check-label" for="order_as_inputted">Order (As inputted in order)</label>
                                            </div>
                                            <div class="form-check mb-3">
                                                <input class="form-check-input" type="checkbox" name="order_group" id="order_group" {{ old('order_group', $printerSetup->order_group ?? false) ? 'checked' : '' }}>
                                                <label class="form-check-label" for="order_group">Group (Order Splitted into Groups)</label>
                                            </div>
                                            <p class="text-primary small mb-3">(Either one of above or both)</p>
                                        </div>
                                        <div class="col-md-5">
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" name="kitchen_duplicate" id="kitchen_duplicate" {{ old('kitchen_duplicate', $printerSetup->kitchen_duplicate ?? false) ? 'checked' : '' }}>
                                                <label class="form-check-label" for="kitchen_duplicate">Kitchen Duplicate</label>
                                            </div>
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" name="kitchen_triplicate" id="kitchen_triplicate" {{ old('kitchen_triplicate', $printerSetup->kitchen_triplicate ?? false) ? 'checked' : '' }}>
                                                <label class="form-check-label" for="kitchen_triplicate">Kitchen Triplicate</label>
                                            </div>
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" name="order_duplicate" id="order_duplicate" {{ old('order_duplicate', $printerSetup->order_duplicate ?? false) ? 'checked' : '' }}>
                                                <label class="form-check-label" for="order_duplicate">Order Duplicate</label>
                                            </div>
                                            <div class="form-check mb-2">
                                                <input class="form-check-input" type="checkbox" name="group_duplicate" id="group_duplicate" {{ old('group_duplicate', $printerSetup->group_duplicate ?? false) ? 'checked' : '' }}>
                                                <label class="form-check-label" for="group_duplicate">Group Duplicate</label>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="border-top mt-3 pt-3">
                                        <div class="form-check mb-2">
                                            <input class="form-check-input" type="checkbox" name="kitchen_printing_yes_no" id="kitchen_printing" {{ old('kitchen_printing_yes_no', $printerSetup->kitchen_printing_yes_no ?? false) ? 'checked' : '' }}>
                                            <label class="form-check-label fw-bold" for="kitchen_printing">Kitchen Printing (Yes/No)</label>
                                        </div>
                                        <div class="form-check mb-2">
                                            <input class="form-check-input" type="checkbox" name="order_print_through_printer_object" id="order_print_obj" {{ old('order_print_through_printer_object', $printerSetup->order_print_through_printer_object ?? false) ? 'checked' : '' }}>
                                            <label class="form-check-label fw-bold" for="order_print_obj">Order Print Through Printer Object</label>
                                        </div>
                                        <div class="form-check mb-2">
                                            <input class="form-check-input" type="checkbox" name="bill_print_through_printer_object" id="bill_print_obj" {{ old('bill_print_through_printer_object', $printerSetup->bill_print_through_printer_object ?? false) ? 'checked' : '' }}>
                                            <label class="form-check-label fw-bold" for="bill_print_obj">Bill Print Through Printer Object</label>
                                        </div>
                                        <div class="form-check mb-2">
                                            <input class="form-check-input" type="checkbox" name="bill_printing_optional_at_billing" id="bill_optional" {{ old('bill_printing_optional_at_billing', $printerSetup->bill_printing_optional_at_billing ?? false) ? 'checked' : '' }}>
                                            <label class="form-check-label fw-bold" for="bill_optional">Bill Printing Optional At The Time of Billing</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-lg-4">
                                <!-- Billing Section -->
                                <div class="p-3 border rounded bg-light-subtle mb-4">
                                    <h6 class="fw-bold text-danger border-bottom pb-2 mb-3">Billing</h6>
                                    <div class="d-flex gap-4 mb-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="billing_type" value="direct" id="bill_direct" {{ old('billing_type', $printerSetup->billing_type ?? 'direct') == 'direct' ? 'checked' : '' }}>
                                            <label class="form-check-label" for="bill_direct">Bill Direct</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="billing_type" value="group_based" id="bill_group" {{ old('billing_type', $printerSetup->billing_type ?? '') == 'group_based' ? 'checked' : '' }}>
                                            <label class="form-check-label" for="bill_group">Bill on group based</label>
                                        </div>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" name="bill_duplicate" id="bill_duplicate" {{ old('bill_duplicate', $printerSetup->bill_duplicate ?? false) ? 'checked' : '' }}>
                                        <label class="form-check-label" for="bill_duplicate">Bill Duplicate</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" name="slip_report" id="slip_report" {{ old('slip_report', $printerSetup->slip_report ?? false) ? 'checked' : '' }}>
                                        <label class="form-check-label" for="slip_report">Slip Report</label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" name="label" id="label" {{ old('label', $printerSetup->label ?? false) ? 'checked' : '' }}>
                                        <label class="form-check-label" for="label">Label</label>
                                    </div>
                                </div>

                                <!-- DOS Printing Section -->
                                <div class="p-3 border rounded bg-light-subtle">
                                    <h6 class="fw-bold text-danger border-bottom pb-2 mb-3">Printer Setup For Dos Printing Report</h6>
                                    <div class="mb-3">
                                        <label class="form-label small">Printer Type (No. of Col.)</label>
                                        <input type="number" name="printer_type_cols" class="form-control form-control-sm" value="{{ old('printer_type_cols', $printerSetup->printer_type_cols ?? 80) }}">
                                    </div>
                                    <div class="mb-0">
                                        <label class="form-label small">No. of Line Print in a Page</label>
                                        <input type="number" name="no_of_line_print" class="form-control form-control-sm" value="{{ old('no_of_line_print', $printerSetup->no_of_line_print ?? 80) }}">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-white py-3">
                        <div class="row align-items-center">
                            <!-- <div class="col-auto">
                                <button type="button" class="btn btn-outline-secondary px-4 me-2">Initialize Print Option</button>
                                <button type="button" class="btn btn-outline-secondary px-4 me-2">Set For Slip Report</button>
                                <button type="button" class="btn btn-outline-secondary px-4 me-2">Table Wise Kitchen Print</button>
                                <button type="button" class="btn btn-outline-secondary px-4 me-2">Tabl Wise Group Print</button>
                                <button type="button" class="btn btn-outline-secondary px-4 me-2">Logo Setup</button>
                            </div> -->
                            <div class="col text-end">
                                <button type="submit" class="btn btn-primary px-5 me-2"><i class="bi bi-save me-1"></i> Save</button>
                                <a href="{{ route('admin.printer-setups.index') }}" class="btn btn-danger px-4 mx-1"><i class="bi bi-x-circle me-1"></i> Close</a>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
