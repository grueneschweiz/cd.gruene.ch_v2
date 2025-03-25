@if( Auth::user() && ! Auth::user()->pending_approval )
    <script src="{{ mix('js/app.js') }}" defer></script>
@endif
