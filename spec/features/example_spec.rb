describe 'Initial Screen', type: :feature do
  it 'has title of the app in a main heading' do
    visit '/'
    expect(page).to have_selector('main h1', text: 'audioplotter')
  end
end
