<!DOCTYPE html>
<html>
<head>
    <title>Pay for Order #{{ $order->id }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">

    <h3>Processing Payment...</h3>

    <button id="rzp-button1" style="display:none;">Pay</button>

    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
    var options = {
        "key": "{{ $key }}", 
        "amount": "{{ $order->total_amount * 100 }}", 
        "currency": "INR",
        "name": "Amigos Pizza",
        "description": "Order #{{ $order->id }}",
        "image": "https://your-logo-url.com/logo.png",
        "order_id": "{{ $razorpayOrderId }}", 
        
        // IMPORTANT: This makes Razorpay POST to your Laravel route on success
        "callback_url": "{{ route('razorpay.callback') }}",
        "redirect": true, // Forces redirect flow (better for mobile)

        "prefill": {
            "name": "{{ $order->user->name ?? 'Guest' }}",
            "email": "{{ $order->user->email ?? 'test@example.com' }}",
            "contact": "{{ $order->user->phone ?? '' }}"
        },
        "theme": {
            "color": "#F37254" 
        }
    };
    
    var rzp1 = new Razorpay(options);
    
    // Automatically open checkout when page loads
    window.onload = function(){
        rzp1.open();
    };
    </script>
</body>
</html>