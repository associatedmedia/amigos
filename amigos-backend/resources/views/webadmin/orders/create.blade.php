@extends('webadmin.layout.app')

@section('content')
<div class="d-flex justify-content-between align-items-center pt-3 pb-2 mb-3 border-bottom">
    <h1 class="h2">Add Order </h1>
    <a href="{{ route('admin.orders.index') }}" class="btn btn-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back</a>
</div>

@if(session('error'))
    <div class="alert alert-danger">{{ session('error') }}</div>
@endif

<form action="{{ route('admin.orders.store') }}" method="POST" id="orderForm">
    @csrf
    <div class="row">
        <div class="col-md-8">
            <div class="card shadow-sm border-0 mb-4">
                <div class="card-header bg-white fw-bold">Order Items</div>
                <div class="card-body p-0">
                    <table class="table table-hover mb-0" id="itemsTable">
                        <thead class="table-light">
                            <tr>
                                <th width="40%">Product</th>
                                <th width="20%">Variety</th>
                                <th width="15%">Price (₹)</th>
                                <th width="15%">Qty</th>
                                <th width="10%">Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="itemRows">
                            <tr class="item-row">
                                <td>
                                    <select name="items[0][product_id]" class="form-select product-select" required>
                                        <option value="">Select...</option>
                                        @foreach($products as $product)
                                            <option value="{{ $product->id }}" data-price="{{ $product->price }}">
                                                {{ $product->name }}
                                            </option>
                                        @endforeach
                                    </select>
                                </td>
                                <td>
                                    <input type="text" name="items[0][variety_name]" class="form-control" placeholder="e.g. Large">
                                </td>
                                <td>
                                    <input type="number" name="items[0][price]" class="form-control item-price" step="0.01" required>
                                </td>
                                <td>
                                    <input type="number" name="items[0][quantity]" class="form-control item-qty" value="1" min="1" required>
                                </td>
                                <td class="item-row-total fw-bold pt-3 text-end">₹0.00</td>
                                <td>
                                    <button type="button" class="btn btn-danger btn-sm remove-row"><i class="bi bi-trash"></i></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="card-footer bg-white">
                    <button type="button" class="btn btn-outline-success btn-sm" id="addItemBtn">
                        <i class="bi bi-plus-circle"></i> Add Another Item
                    </button>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card shadow-sm border-0 mb-4">
                <div class="card-header bg-white fw-bold">Order Details</div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Customer</label>
                        <select name="user_id" class="form-select select2" required>
                            @foreach($customers as $customer)
                                <option value="{{ $customer->id }}">
                                    {{ $customer->name }} ({{ $customer->mobile_no }})
                                </option>
                            @endforeach
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select name="status" class="form-select select2">
                            @foreach($orderStatuses as $statusObj)
                                <option value="{{ $statusObj->status_code }}" {{ $statusObj->status_code == 'pending' ? 'selected' : '' }}>{{ $statusObj->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Payment</label>
                        <div class="input-group">
                            <select name="payment_method" class="form-select select2">
                                <option value="cash" selected>Cash (COD)</option>
                                <option value="razorpay">Online</option>
                            </select>
                            <select name="payment_status" class="form-select select2">
                                <option value="pending" selected>Pending</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card shadow-sm border-0 bg-light">
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <span>Subtotal</span>
                        <span id="displaySubtotal">₹0.00</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Delivery Fee</span>
                        <input type="number" name="delivery_fee" id="deliveryFee" class="form-control form-control-sm w-50 text-end" value="0" step="0.01">
                    </div>
                    <hr>
                    <div class="d-flex justify-content-between fw-bold fs-5 text-success">
                        <span>Grand Total</span>
                        <span id="displayGrandTotal">₹0.00</span>
                    </div>
                </div>
                <div class="card-footer border-0 bg-light text-end">
                    <button type="submit" class="btn btn-primary w-100"><i class="bi bi-save"></i> Save Changes</button>
                </div>
            </div>
        </div>
    </div>
</form>

@endsection

@push('scripts')
<script>
    $(document).ready(function() {
        if($('.select2').length) {
            $('.select2').select2({
                theme: 'bootstrap-5',
                width: '100%'
            });
        }
    });
</script>
<script>
    document.addEventListener('DOMContentLoaded', function () {
        let rowCount = 1;
        const tbody = document.getElementById('itemRows');

        // Function to calculate totals
        function calculateTotals() {
            let subtotal = 0;
            document.querySelectorAll('.item-row').forEach(row => {
                let price = parseFloat(row.querySelector('.item-price').value) || 0;
                let qty = parseFloat(row.querySelector('.item-qty').value) || 0;
                let total = price * qty;
                row.querySelector('.item-row-total').innerText = '₹' + total.toFixed(2);
                subtotal += total;
            });

            let deliveryFee = parseFloat(document.getElementById('deliveryFee').value) || 0;
            let gst = subtotal * 0.05; // 5% GST
            let grandTotal = subtotal + gst + deliveryFee;

            document.getElementById('displaySubtotal').innerText = '₹' + subtotal.toFixed(2);
            document.getElementById('displayGrandTotal').innerText = '₹' + grandTotal.toFixed(2);
        }

        // Add new row logic
        document.getElementById('addItemBtn').addEventListener('click', function () {
            let firstRow = document.querySelector('.item-row');
            let newRow = firstRow.cloneNode(true);
            
            // Reset values and update indices
            newRow.querySelectorAll('input, select').forEach(input => {
                input.name = input.name.replace(/\[\d+\]/, '[' + rowCount + ']');
                if(input.tagName === 'INPUT') input.value = input.classList.contains('item-qty') ? 1 : '';
            });
            newRow.querySelector('.item-row-total').innerText = '₹0.00';
            
            tbody.appendChild(newRow);
            rowCount++;
            calculateTotals();
        });

        // Event delegation for dynamically added rows
        tbody.addEventListener('change', function (e) {
            if (e.target.classList.contains('product-select')) {
                // Auto-fill price when product changes
                let selectedOption = e.target.options[e.target.selectedIndex];
                let price = selectedOption.getAttribute('data-price');
                let row = e.target.closest('tr');
                row.querySelector('.item-price').value = price || 0;
                calculateTotals();
            }
        });

        tbody.addEventListener('input', function (e) {
            if (e.target.classList.contains('item-qty') || e.target.classList.contains('item-price')) {
                calculateTotals();
            }
        });

        tbody.addEventListener('click', function (e) {
            if (e.target.closest('.remove-row')) {
                if (document.querySelectorAll('.item-row').length > 1) {
                    e.target.closest('tr').remove();
                    calculateTotals();
                } else {
                    alert('You must have at least one item in the order.');
                }
            }
        });

        document.getElementById('deliveryFee').addEventListener('input', calculateTotals);

        // Initial Calculation
        calculateTotals();
    });
</script>
@endpush