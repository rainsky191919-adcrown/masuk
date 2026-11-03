"""Real local DB + real RPC + isolated browser identities; no cloud data writes."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from local_api import session_for

BASE = 'http://127.0.0.1:5173'
OUT = Path('work/shared-backend')
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    contexts = []
    errors = []
    def user_page(number):
        context = browser.new_context(viewport={'width': 1440, 'height': 1000})
        contexts.append(context)
        session = session_for(f'00000000-0000-0000-0000-{number:012d}')
        context.add_init_script('localStorage.setItem("sb-127-auth-token", ' + json.dumps(json.dumps(session)) + ');')
        context.add_init_script('localStorage.setItem("masuk-community-v1", JSON.stringify({posts:[{id:"legacy-local",title:"Old local test"}],feedback:[]}));')
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE)
        expect(page.locator('.location-card').first).to_be_visible()
        expect(page.locator('.auth-button')).to_contain_text(session['user']['user_metadata']['full_name'])
        return page
    def detail(page):
        page.get_by_placeholder('搜公寓、住宅区、街道…').fill('Bukit Impian')
        page.get_by_role('button', name='Bukit Impian Residence', exact=True).click()
        expect(page.locator('.community-notice')).to_contain_text('云端共享')
    try:
        rider = user_page(2)
        expect(rider.get_by_role('button', name='后台管理', exact=False)).to_have_count(0)
        detail(rider)
        expect(rider.get_by_text('Old local test', exact=True)).to_have_count(0)
        form = rider.locator('.community-form').filter(has=rider.get_by_label('标题', exact=True))
        form.get_by_label('标题', exact=True).fill('Local shared test')
        form.get_by_label('内容', exact=True).fill('Saved in real isolated Postgres')
        form.get_by_role('button', name='发布帖子', exact=True).click()
        expect(rider.locator('.discussion-post')).to_have_count(1)
        other = user_page(3)
        detail(other)
        expect(other.locator('.discussion-post')).to_contain_text('Local shared test')
        expect(other.get_by_role('button', name='删除', exact=True)).to_have_count(0)
        other.get_by_role('button', name='我要回复', exact=False).click()
        other.get_by_label('回复内容').fill('Cross-device reply')
        other.get_by_role('button', name='发布回复', exact=True).click()
        expect(other.locator('.post-reply')).to_contain_text('Cross-device reply')
        other.get_by_role('button', name='0 人有帮助').click()
        expect(other.get_by_role('button', name='1 人有帮助')).to_have_attribute('aria-pressed', 'true')
        other.once('dialog', lambda dialog: dialog.accept('Local report reason'))
        other.get_by_role('button', name='举报', exact=True).click()
        expect(other.get_by_role('button', name='已举报', exact=True)).to_be_disabled()
        owner = user_page(1)
        owner.get_by_role('button', name='后台管理', exact=False).click()
        expect(owner.get_by_role('heading', name='管理员账号', exact=True)).to_be_visible()
        report = owner.locator('.discussion-post').filter(has_text='Local report reason')
        expect(report).to_contain_text('Saved in real isolated Postgres')
        report.get_by_label('处理说明').fill('Confirmed by local QA')
        report.get_by_role('checkbox').check()
        report.get_by_role('button', name='提交处理结果').click()
        expect(report).to_have_count(0)
        other.reload()
        detail(other)
        expect(other.locator('.discussion-post')).to_have_count(0)
        for width in [1440, 390, 320]:
            owner.set_viewport_size({'width': width, 'height': 1000})
            assert owner.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'Admin overflow at {width}'
            owner.screenshot(path=str(OUT / f'admin-{width}.png'), full_page=True)
        assert rider.evaluate('JSON.parse(localStorage.getItem("masuk-community-v1")).posts[0].id') == 'legacy-local'
        assert not errors, errors
        print('PASS: real RPC post/reply/helpful/report; cross-context persistence; server roles; admin resolution hides content; old local data preserved; responsive admin; no page errors')
    finally:
        for context in contexts:
            context.close()
        browser.close()
