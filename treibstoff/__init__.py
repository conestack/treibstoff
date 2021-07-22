from cone.app import cfg
from cone.app import main_hook
from pyramid.static import static_view


@main_hook
def initialize_treibstoff(config, global_config, settings):
    cfg.css.public.append('treibstoff-static/treibstoff.css')
    cfg.js.public.append('treibstoff-static/treibstoff.bundle.js')

    config.add_view(
        static_view('static', use_subpath=True),
        name='treibstoff-static'
    )
